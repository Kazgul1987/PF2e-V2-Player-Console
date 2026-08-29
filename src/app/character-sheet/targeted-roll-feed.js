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

    /**
     * Execute the deliberately small fixed-DC subset that can be bound to a V2 sheet actor without
     * reproducing PF2e's private inline-check handler. Everything else stays visible but is inert.
     */
    static async rollCheck(event, link, actor) {
        event.preventDefault();
        event.stopPropagation();

        try {
            if (!this.#supportedCheck(link)) {
                ui.notifications.warn(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.RollFeed.UnsupportedCheck"));
                return;
            }
            if (!actor?.isOwner || !actor.canUserModify?.(game.user, "update")) {
                throw new Error("The current user does not own the sheet actor");
            }

            const statistic = actor.getStatistic(link.dataset.pf2Check);
            if (!statistic) throw new Error(`Sheet actor has no '${link.dataset.pf2Check}' statistic`);
            await statistic.roll({
                event,
                dc: { label: link.dataset.pf2Label, value: Number.parseInt(link.dataset.pf2Dc, 10) },
            });
        } catch (error) {
            console.warn("PF2e V2 Player Console | Roll Feed: Failed to execute inline check", {
                actor: actor?.uuid,
                error,
            });
        }
    }

    static #supportedCheck(link) {
        const { pf2Check, pf2Dc, rollerRole } = link.dataset;
        if (!pf2Check || pf2Check === "flat" || !/^\d+$/.test(pf2Dc ?? "")) return false;

        const expectedRollerRole = pf2Check in (CONFIG.PF2E.saves ?? {}) ? "target" : "origin";
        if (rollerRole && rollerRole !== expectedRollerRole) return false;

        // PF2e's private click handler owns all of these semantics. The feed must not partially reproduce them.
        return ![
            "against", "itemUuid", "overrideTraits", "pf2Adjustment", "pf2Defense", "pf2Roller",
            "pf2RollOptions", "pf2Traits", "targetOwner",
        ].some((key) => key in link.dataset) && !("invalid" in link.dataset);
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
        const unsupported = game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.RollFeed.UnsupportedCheck");
        for (const check of checks.filter((check) => !this.#supportedCheck(check))) {
            check.dataset.rollFeedUnsupported = "";
            check.setAttribute("aria-disabled", "true");
            check.setAttribute("title", unsupported);
        }
        return checks.map((check) => check.outerHTML).join(" ");
    }
}
