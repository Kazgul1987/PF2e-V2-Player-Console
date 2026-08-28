import { MODULE_ID } from "../../constants.js";

export const MAX_ROLL_FEED_ENTRIES = 20;
const FLAG_PATH = `flags.${MODULE_ID}.rollFeed`;

/** Chat-backed data and hooks for the player-sheet roll feed. */
export class TargetedRollFeed {
    static registerHooks() {
        Hooks.on("preCreateChatMessage", (message, data, options, userId) => {
            if (!game.user?.isGM || userId !== game.user.id || !this.#containsInlineCheck(data.content ?? message.content)) return;
            const targets = [...new Set([...game.user.targets].map((token) => token.actor?.uuid).filter(Boolean))];
            if (targets.length) message.updateSource({ [FLAG_PATH]: { targets, version: 1 } });
        });
    }

    static async prepare(actor, collapsed = false) {
        const candidates = [...(game.messages?.contents ?? game.messages ?? [])]
            .filter((message) => this.#isCandidate(message, actor))
            .slice(-MAX_ROLL_FEED_ENTRIES);
        const entries = (await Promise.all(candidates.map(async (message) => {
            try {
                return await this.#entry(message, actor);
            } catch (error) {
                console.warn("PF2e V2 Player Console | Roll Feed: Failed to enrich a chat message", { message, error });
                return null;
            }
        }))).filter(Boolean);
        return { actorUuid: actor.uuid, collapsed, entries, empty: entries.length === 0 };
    }

    static affectsActor(message, actor) {
        if (!message || !actor || !this.isVisible(message)) return false;
        const targets = message.getFlag?.(MODULE_ID, "rollFeed.targets") ?? [];
        return targets.includes(actor.uuid) || this.#messageActorUuid(message) === actor.uuid;
    }

    static isVisible(message) {
        return message?.visible !== false && message?.isContentVisible !== false;
    }

    /** Execute an enriched PF2e check with the owning sheet actor, bypassing PF2e's DOM actor resolver. */
    static async rollCheck(event, link, actor) {
        event.preventDefault();
        event.stopPropagation();

        try {
            if (!actor?.isOwner || !actor.canUserModify?.(game.user, "update")) {
                throw new Error("The current user does not own the sheet actor");
            }

            const { pf2Check, pf2Dc, pf2Traits, pf2Label, pf2Adjustment, pf2RollOptions } = link.dataset;
            if (!pf2Check) throw new Error("The enriched link has no check type");

            // These values were parsed and normalized by PF2e's TextEditor enrichment. Do not parse @Check here.
            const splitList = (value) => String(value ?? "").split(",").map((part) => part.trim()).filter(Boolean);
            const traits = splitList(pf2Traits);
            const actionTraits = traits.filter((trait) => trait in (CONFIG.PF2E.actionTraits ?? {}));
            const extraRollOptions = [...new Set([
                ...traits,
                ...actionTraits.map((trait) => `item:trait:${trait}`),
                ...splitList(pf2RollOptions),
            ])];
            const adjustment = Number(pf2Adjustment) || 0;
            const article = link.closest?.("[data-message-id]");
            const message = article?.dataset.messageId ? game.messages.get(article.dataset.messageId) : null;
            const parentActor = message?.actor ?? message?.speakerActor ?? null;
            const item = link.dataset.itemUuid ? fromUuidSync(link.dataset.itemUuid) : null;
            const isSave = pf2Check in (CONFIG.PF2E.saves ?? {});
            const rollerRole = ["origin", "target"].includes(link.dataset.rollerRole)
                ? link.dataset.rollerRole
                : isSave ? "target" : "origin";
            const targetActor = link.dataset.against && rollerRole === "target"
                ? actor
                : "targetOwner" in link.dataset ? parentActor : game.user.targets.first()?.actor ?? null;
            const opposingActor = rollerRole === "target" ? parentActor : targetActor;
            const originActor = rollerRole === "origin" ? actor : parentActor;
            const against = link.dataset.against || link.dataset.pf2Defense;
            const dcValue = Number(pf2Dc ?? "NaN");
            const dc = (() => {
                if (Number.isInteger(dcValue)) return { label: pf2Label, value: dcValue + adjustment };
                if (!against) return null;
                const defense = opposingActor?.getStatistic(against)?.clone({
                    modifiers: adjustment ? [new game.pf2e.Modifier({
                        label: "PF2E.InlineCheck.DCAdjustment",
                        modifier: adjustment,
                    })] : [],
                });
                return defense ? { label: defense.dc.label, statistic: defense.dc, scope: "check", value: defense.dc.value } : null;
            })();
            const relatedItem = item?.actor?.uuid === actor.uuid ? item : null;
            const args = {
                event,
                dc,
                extraRollOptions,
                item: relatedItem,
                origin: originActor,
                target: dc?.statistic ? targetActor : null,
                traits: isSave ? [] : actionTraits,
            };

            if (pf2Check === "flat") {
                const check = new game.pf2e.CheckModifier("flat", { modifiers: [] });
                await game.pf2e.Check.roll(check, {
                    actor,
                    dc,
                    options: extraRollOptions,
                    type: "flat-check",
                }, event);
                return;
            }

            const statistic = actor.getStatistic(pf2Check, { item: relatedItem });
            if (!statistic) throw new Error(`Sheet actor has no '${pf2Check}' statistic`);
            await statistic.roll(args);
        } catch (error) {
            console.warn("PF2e V2 Player Console | Roll Feed: Failed to execute inline check", {
                actor: actor?.uuid,
                error,
            });
        }
    }

    static #containsInlineCheck(content) {
        return /@Check\s*\[/i.test(String(content ?? "")) || /data-pf2-check(?:\s|=|>)/i.test(String(content ?? ""));
    }

    static #isCandidate(message, actor) {
        if (!this.affectsActor(message, actor)) return false;
        const targets = message.getFlag?.(MODULE_ID, "rollFeed.targets") ?? [];
        return targets.includes(actor.uuid) || (message.isCheckRoll === true && !!message.rolls?.[0]);
    }

    static async #entry(message, actor) {
        const targets = message.getFlag?.(MODULE_ID, "rollFeed.targets") ?? [];
        if (targets.includes(actor.uuid)) {
            const checks = await this.#inlineChecks(message.content, actor);
            if (!checks) return null;
            return { id: message.id, type: "request", author: message.author?.name ?? game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.RollFeed.GMRequest"), checks };
        }

        if (this.#messageActorUuid(message) !== actor.uuid || message.isCheckRoll !== true) return null;
        const roll = message.rolls?.[0];
        if (!roll) return null;
        const degree = Number.isInteger(roll.degreeOfSuccess)
            ? game.i18n.localize(`PF2E_V2_PLAYER_CONSOLE.RollFeed.Degree.${roll.degreeOfSuccess}`)
            : null;
        return {
            id: message.id,
            type: "result",
            label: roll.options?.label ?? roll.options?.type ?? game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.RollFeed.Result"),
            total: roll.total,
            degree,
        };
    }

    static #messageActorUuid(message) {
        return message.actor?.uuid ?? message.speakerActor?.uuid ?? null;
    }

    static async #inlineChecks(content, actor) {
        const enriched = await foundry.applications.ux.TextEditor.implementation.enrichHTML(String(content ?? ""), {
            relativeTo: actor,
            rollData: actor.getRollData(),
        });
        const container = foundry.utils.parseHTML(`<div>${enriched}</div>`);
        const checks = [...container.querySelectorAll("a[data-pf2-check], span[data-pf2-check]")];
        if (!checks.length) return null;
        return checks.map((check) => check.outerHTML).join(" ");
    }
}
