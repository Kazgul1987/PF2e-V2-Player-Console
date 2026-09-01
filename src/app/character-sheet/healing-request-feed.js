import { LOG_PREFIX, MODULE_ID } from "../../constants.js";

const FLAG_PATH = `flags.${MODULE_ID}.healingFeed`;
const FLAG_NAME = "healingFeed";
const CLAIMS_FLAG = "healingClaims";

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
        const claims = actor.getFlag?.(MODULE_ID, CLAIMS_FLAG) ?? {};
        const entries = [...(game.messages?.contents ?? game.messages ?? [])].flatMap((message) =>
            this.#records(message).flatMap((record) => {
                const target = record.targets.find((candidate) => candidate.actorUuid === actor.uuid);
                if (!target) return [];
                const requestId = this.#requestId(message, record.rollIndex);
                if (claims[requestId]) return [];
                return [{
                    id: requestId,
                    messageId: message.id,
                    rollIndex: record.rollIndex,
                    amount: record.amount,
                    label: message.item?.name ?? game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Healing.GenericSource"),
                }];
            }),
        );
        return { entries, empty: entries.length === 0 };
    }

    static async apply(messageId, rollIndex, actor) {
        if (actor?.type !== "character" || (!game.user?.isGM && !actor.canUserModify?.(game.user, "update"))) {
            return ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Healing.NotPermitted"));
        }

        const message = game.messages.get(messageId);
        const record = this.#records(message).find((candidate) => candidate.rollIndex === rollIndex);
        const target = record?.targets.find((candidate) => candidate.actorUuid === actor.uuid);
        if (!message || !record || !target) return;

        const requestId = this.#requestId(message, rollIndex);
        const currentClaims = actor.getFlag?.(MODULE_ID, CLAIMS_FLAG) ?? {};
        if (currentClaims[requestId]) {
            ui.notifications.info(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Healing.AlreadyApplied"));
            return;
        }

        // Foundry has no compare-and-swap document update. A nonce-bearing document claim, followed by an immediate
        // reread, narrows the cross-client race substantially and is also authoritative across sheets and reloads.
        const nonce = foundry.utils.randomID();
        const claim = { state: "applying", nonce, userId: game.user.id, timestamp: Date.now() };
        await actor.setFlag(MODULE_ID, CLAIMS_FLAG, { ...currentClaims, [requestId]: claim });
        const claimed = actor.getFlag(MODULE_ID, CLAIMS_FLAG)?.[requestId];
        if (claimed?.nonce !== nonce) return;

        try {
            const tokenDocument = target.tokenUuid ? await fromUuid(target.tokenUuid) : null;
            const token = tokenDocument?.object ?? actor.getActiveTokens?.(true, true)?.at(0) ?? null;
            if (!token || token.actor?.uuid !== actor.uuid || typeof actor.applyDamage !== "function") {
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
        } catch (error) {
            const claims = { ...(actor.getFlag(MODULE_ID, CLAIMS_FLAG) ?? {}) };
            if (claims[requestId]?.nonce === nonce) {
                delete claims[requestId];
                await actor.setFlag(MODULE_ID, CLAIMS_FLAG, claims);
            }
            console.warn(`${LOG_PREFIX} Failed to apply healing request`, { actor: actor.uuid, messageId, rollIndex, error });
            ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Healing.ApplyFailed"));
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

    static #requestId(message, rollIndex) {
        return `${message.id}-${rollIndex}`;
    }
}
