import { LOG_PREFIX } from "../constants.js";

/** Invoke PF2e's public Statistic check surface without recreating check maths. */
export class RollController {
    static async rollStatistic(actor, slug, event, { secret = false } = {}) {
        const statistic = actor?.getStatistic?.(slug);
        if (!statistic?.roll) {
            console.warn(`${LOG_PREFIX} Statistic check is not available`, { actor: actor?.uuid, slug });
            ui.notifications.warn(game.i18n.format("PF2E_V2_PLAYER_CONSOLE.Errors.StatisticUnavailable", {
                statistic: slug || game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Labels.RequestedStatistic"),
            }));
            return null;
        }

        return statistic.roll({
            ...this.#eventToRollParams(event),
            ...(secret ? { extraRollOptions: ["secret"] } : {}),
        });
    }

    static rollPerception(actor, event) {
        return this.rollStatistic(actor, "perception", event);
    }

    static rollSave(actor, slug, event) {
        return this.rollStatistic(actor, slug, event);
    }

    static rollSkill(actor, slug, event) {
        return this.rollStatistic(actor, slug, event);
    }

    /** Mirror PF2e's non-exported sheet helper using only stable runtime state. */
    static #eventToRollParams(event) {
        const skipDefault = !game.user.settings.showCheckDialogs;
        if (!event || !("ctrlKey" in event) || !("metaKey" in event) || !("shiftKey" in event)) {
            return { skipDialog: skipDefault };
        }

        const params = { skipDialog: event.shiftKey ? !skipDefault : skipDefault };
        if (event.ctrlKey || event.metaKey) params.messageMode = game.user.isGM ? "gm" : "blind";
        return params;
    }
}
