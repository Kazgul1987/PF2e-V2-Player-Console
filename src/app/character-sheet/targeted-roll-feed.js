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
        return { collapsed, entries, empty: entries.length === 0 };
    }

    static affectsActor(message, actor) {
        if (!message || !actor || !this.isVisible(message)) return false;
        const targets = message.getFlag?.(MODULE_ID, "rollFeed.targets") ?? [];
        return targets.includes(actor.uuid) || this.#messageActorUuid(message) === actor.uuid;
    }

    static isVisible(message) {
        return message?.visible !== false && message?.isContentVisible !== false;
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
