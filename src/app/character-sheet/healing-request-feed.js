import { LOG_PREFIX, MODULE_ID } from "../../constants.js";

const FLAG_PATH = `flags.${MODULE_ID}.healingFeed`;
const FLAG_NAME = "healingFeed";
const CLAIMS_FLAG = "healingClaims";
const APPLY_REQUEST_FLAG = "healingApplyRequest";
const SOCKET_NAME = `module.${MODULE_ID}`;
const inFlight = new Set();
const pendingResults = new Map();

/** Chat-backed healing requests for the V2 character sheet. */
export class HealingRequestFeed {
    static registerHooks() {
        Hooks.on("preCreateChatMessage", (message, data, _options, userId) => {
            if (userId !== game.user?.id || message.getFlag?.(MODULE_ID, FLAG_NAME)) return;

            const rolls = this.#healingRolls(message.rolls ?? data.rolls ?? []);
            if (!rolls.length) return;
            const targets = this.#targets(message, data);
            if (!targets.length) return;

            message.updateSource({
                [FLAG_PATH]: {
                    version: 1,
                    rolls: rolls.map(({ rollIndex, amount }) => ({ rollIndex, amount, targets })),
                },
            });
        });
        Hooks.on("createChatMessage", (message) => {
            if (this.#authority()?.id === game.user?.id) void this.#claimExternalHealing(message);
        });
        Hooks.on("updateActor", (actor, changed, _options, userId) => {
            const request = changed?.flags?.[MODULE_ID]?.[APPLY_REQUEST_FLAG];
            if (request && this.#authority()?.id === game.user?.id) {
                void this.#applyAsAuthority(actor, request, userId);
            }
        });
        Hooks.once("ready", () => game.socket.on(SOCKET_NAME, (data) => this.#onSocket(data)));
    }

    static #healingRolls(rolls) {
        const DamageRoll = (CONFIG.Dice.rolls ?? []).find((RollClass) => RollClass.name === "DamageRoll");
        return Array.from(rolls).flatMap((roll, rollIndex) => {
            // PF2e registers DamageRoll in CONFIG.Dice.rolls. Requiring that runtime class prevents ordinary Rolls
            // with coincidentally similar options from becoming healing requests.
            if (!DamageRoll || !(roll instanceof DamageRoll) || !(roll.kinds instanceof Set)) return [];
            if (roll.kinds.size !== 1 || !roll.kinds.has("healing")) return [];
            // Pure-healing DamageRolls have no damage component, so their evaluated total is unambiguous. Mixed
            // instances are deliberately rejected above rather than interpreting the aggregate total as healing.
            const amount = Number(roll.total);
            return Number.isFinite(amount) && amount > 0 ? [{ rollIndex, amount }] : [];
        });
    }

    static #targets(message, data) {
        const context = message.flags?.pf2e?.context ?? data.flags?.pf2e?.context;
        const structured = context?.target;
        if (structured?.actor) {
            const document = fromUuidSync(structured.actor);
            const actor = document?.actor ?? document;
            return actor?.type === "character"
                ? [{ actorUuid: actor.uuid, ...(structured.token ? { tokenUuid: structured.token } : {}) }]
                : [];
        }

        // preCreate runs on the creating user's client. Capture its targets now: game.user.targets on receiving
        // clients describes a different user and must never be consulted later.
        return [...(game.user?.targets ?? [])]
            .filter((token) => token.actor?.type === "character" && token.actor.uuid)
            .map((token) => ({ actorUuid: token.actor.uuid, ...(token.document?.uuid ? { tokenUuid: token.document.uuid } : {}) }))
            .filter((target, index, all) => all.findIndex((other) => other.actorUuid === target.actorUuid) === index);
    }

    static affectsActor(message, actor) {
        return this.#records(message).some((record) => record.targets.some((target) => target.actorUuid === actor?.uuid));
    }

    static prepare(actor) {
        if (actor?.type !== "character") return { entries: [], empty: true };
        const entries = this.#openRequests(actor).map(({ requestId, message, record }) => ({
            id: requestId,
            messageId: message.id,
            rollIndex: record.rollIndex,
            amount: record.amount,
            label: message.item?.name ?? game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Healing.GenericSource"),
        }));
        return { entries, empty: entries.length === 0 };
    }

    static #openRequests(actor) {
        const claims = actor.getFlag?.(MODULE_ID, CLAIMS_FLAG) ?? {};
        return [...(game.messages?.contents ?? game.messages ?? [])].flatMap((message) =>
            this.#records(message).flatMap((record) => {
                const target = record.targets.find((candidate) => candidate.actorUuid === actor.uuid);
                if (!target) return [];
                const requestId = this.#requestId(message, record.rollIndex, actor.uuid);
                if (this.#hasClaim(claims, requestId, this.#legacyRequestId(message, record.rollIndex, actor.uuid))) return [];
                return [{ requestId, message, record }];
            }),
        );
    }

    /** Claim a request after PF2e, rather than this feed, has already applied its healing. */
    static async #claimExternalHealing(applicationMessage) {
        const applied = applicationMessage?.flags?.pf2e?.appliedDamage;
        if (!applied?.isHealing || typeof applied.uuid !== "string" || !Array.isArray(applied.updates)) return;
        const hpUpdate = applied.updates.find((update) => update?.path === "system.attributes.hp.value");
        const damageTaken = Number(hpUpdate?.value);
        if (!(damageTaken < 0)) return;

        const actor = await fromUuid(applied.uuid);
        if (actor?.type !== "character") return;

        const open = this.#openRequests(actor);
        if (!open.length || open.some(({ requestId }) => inFlight.has(requestId))) return;

        // PF2e v14 does not retain the originating message or roll index in this result. A lone open request is
        // nevertheless unambiguous even when maximum-HP clamping makes the effective delta smaller than its roll.
        // With several requests, retain the conservative unique-amount fallback and never guess between duplicates.
        const matches = open.length === 1
            ? open
            : open.filter(({ record }) => record.amount === Math.abs(damageTaken));
        if (matches.length !== 1) return;

        const [{ requestId, message, record }] = matches;
        if (inFlight.has(requestId)) return;
        inFlight.add(requestId);
        try {
            const claims = actor.getFlag?.(MODULE_ID, CLAIMS_FLAG) ?? {};
            if (this.#hasClaim(claims, requestId, this.#legacyRequestId(message, record.rollIndex, actor.uuid))) return;
            await actor.setFlag(MODULE_ID, CLAIMS_FLAG, {
                ...claims,
                [requestId]: { state: "applied", userId: game.user.id, timestamp: Date.now() },
            });
        } catch (error) {
            console.warn(`${LOG_PREFIX} Failed to claim externally applied healing`, { actorUuid: actor.uuid, error });
        } finally {
            inFlight.delete(requestId);
        }
    }

    static async apply(messageId, rollIndex, actor) {
        if (actor?.type !== "character" || (!game.user?.isGM && !actor.canUserModify?.(game.user, "update"))) {
            return ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Healing.NotPermitted"));
        }

        const message = game.messages.get(messageId);
        const record = this.#records(message).find((candidate) => candidate.rollIndex === rollIndex);
        const target = record?.targets.find((candidate) => candidate.actorUuid === actor.uuid);
        if (!message || !record || !target) return;

        const requestId = this.#requestId(message, rollIndex, actor.uuid);
        const claims = actor.getFlag?.(MODULE_ID, CLAIMS_FLAG) ?? {};
        if (this.#hasClaim(claims, requestId, this.#legacyRequestId(message, rollIndex, actor.uuid))) {
            ui.notifications.info(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Healing.AlreadyApplied"));
            return false;
        }

        const authority = this.#authority();
        if (!authority) {
            ui.notifications.warn(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Healing.NoActiveGM"));
            return false;
        }

        const correlationId = foundry.utils.randomID();
        const request = {
            messageUuid: message.uuid,
            actorUuid: actor.uuid,
            requestId,
            rollIndex,
            correlationId,
        };
        const result = new Promise((resolve) => pendingResults.set(correlationId, resolve));
        try {
            // Foundry authorizes this Actor update on the server. The authority receives its authenticated userId
            // from updateActor rather than trusting an identity asserted by a socket payload.
            await actor.setFlag(MODULE_ID, APPLY_REQUEST_FLAG, request);
        } catch (error) {
            pendingResults.delete(correlationId);
            console.warn(`${LOG_PREFIX} Failed to submit healing request`, { actorUuid: actor.uuid, error });
            ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Healing.ApplyFailed"));
            return false;
        }
        return result;
    }

    static #authority() {
        return [...(game.users ?? [])]
            .filter((user) => user.active && user.isGM)
            .sort((a, b) => a.id.localeCompare(b.id))
            .at(0) ?? null;
    }

    static #onSocket(data) {
        if (data?.type !== "healing-apply-result" || data.recipientId !== game.user?.id) return;
        const resolve = pendingResults.get(data.correlationId);
        if (!resolve) return;
        pendingResults.delete(data.correlationId);
        resolve(data.success === true);
        if (!data.success) ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Healing.ApplyFailed"));
    }

    static async #applyAsAuthority(requestActor, request, authenticatedUserId) {
        const { messageUuid, actorUuid, requestId, rollIndex, correlationId } = request ?? {};
        const recipientId = authenticatedUserId;
        const respond = (success, reason) => {
            const result = {
                type: "healing-apply-result", recipientId, requestId, correlationId, success, ...(reason ? { reason } : {}),
            };
            if (recipientId === game.user?.id) this.#onSocket(result);
            else game.socket.emit(SOCKET_NAME, result);
        };
        let reason = "invalid-request";
        let success = false;

        if (this.#authority()?.id !== game.user?.id) return;
        if (![messageUuid, actorUuid, requestId, correlationId, recipientId].every((value) => typeof value === "string") ||
            !Number.isInteger(rollIndex)) {
            await this.#clearApplyRequest(requestActor, correlationId);
            respond(false, reason);
            return;
        }
        if (inFlight.has(requestId)) {
            await this.#clearApplyRequest(requestActor, correlationId);
            respond(false, "already-processing");
            return;
        }
        inFlight.add(requestId);

        try {
            // Treat socket fields only as lookup keys. Reconstruct the amount, target, item, and outcome from the
            // current ChatMessage documents, and recheck that the requesting user may update the target actor.
            const message = await fromUuid(messageUuid);
            const actor = await fromUuid(actorUuid);
            const record = this.#records(message).find((candidate) => candidate.rollIndex === rollIndex);
            const target = record?.targets.find((candidate) => candidate.actorUuid === actor?.uuid);
            const authenticatedUser = game.users.get(authenticatedUserId);
            if (message?.documentName !== "ChatMessage" || actor?.type !== "character" || actor.uuid !== requestActor?.uuid ||
                !record || !target || requestId !== this.#requestId(message, rollIndex, actorUuid) ||
                !authenticatedUser || !actor.canUserModify?.(authenticatedUser, "update")) throw new Error(reason);
            const existingClaims = actor.getFlag?.(MODULE_ID, CLAIMS_FLAG) ?? {};
            if (this.#hasClaim(existingClaims, requestId, this.#legacyRequestId(message, rollIndex, actorUuid))) {
                reason = "already-applied";
                throw new Error(reason);
            }

            let token = null;
            if (target.tokenUuid) {
                const document = await fromUuid(target.tokenUuid);
                if (document?.documentName === "Token" && document.actor?.uuid === actor.uuid) token = document;
            }
            const activeToken = token ? null : actor.getActiveTokens?.(true, true)?.at(0);
            token ??= activeToken?.document ?? null;
            if (token?.documentName !== "Token" || token.actor?.uuid !== actor.uuid || typeof actor.applyDamage !== "function") {
                throw new Error("PF2e applyDamage requires an active token for the targeted actor");
            }

            // PF2e's own chat helper calls ActorPF2e#applyDamage with a negative value and skipIWR for healing.
            // This is the public actor method; no chat-button DOM or direct HP update is used.
            await actor.applyDamage({
                damage: -record.amount,
                token,
                item: message.item ?? undefined,
                skipIWR: true,
                outcome: message.flags?.pf2e?.context?.outcome ?? null,
            });
            const claims = actor.getFlag(MODULE_ID, CLAIMS_FLAG) ?? {};
            await actor.setFlag(MODULE_ID, CLAIMS_FLAG, {
                ...claims,
                [requestId]: { state: "applied", userId: game.user.id, timestamp: Date.now() },
            });
            success = true;
            reason = null;
        } catch (error) {
            console.warn(`${LOG_PREFIX} Failed to apply healing request`, { actorUuid, messageUuid, rollIndex, error });
        } finally {
            inFlight.delete(requestId);
            await this.#clearApplyRequest(requestActor, correlationId);
            respond(success, reason);
        }
    }

    static async #clearApplyRequest(actor, correlationId) {
        if (actor?.getFlag?.(MODULE_ID, APPLY_REQUEST_FLAG)?.correlationId !== correlationId) return;
        try {
            await actor.unsetFlag(MODULE_ID, APPLY_REQUEST_FLAG);
        } catch (error) {
            console.warn(`${LOG_PREFIX} Failed to clean up healing request`, { actorUuid: actor.uuid, correlationId, error });
        }
    }

    static #records(message) {
        const feed = message?.getFlag?.(MODULE_ID, FLAG_NAME);
        if (feed?.version !== 1 || !Array.isArray(feed.rolls)) return [];
        return feed.rolls.filter((record) =>
            Number.isInteger(record?.rollIndex) && Number.isFinite(record?.amount) && record.amount > 0 &&
            Array.isArray(record.targets),
        );
    }

    static #requestId(message, rollIndex, actorUuid) {
        return this.#legacyRequestId(message, rollIndex, actorUuid).replaceAll(".", "_");
    }

    static #legacyRequestId(message, rollIndex, actorUuid) {
        return `${message.id}-${rollIndex}-${actorUuid}`;
    }

    static #hasClaim(claims, requestId, legacyRequestId) {
        return Boolean(claims?.[requestId] ?? claims?.[legacyRequestId] ?? foundry.utils.getProperty(claims, legacyRequestId));
    }
}
