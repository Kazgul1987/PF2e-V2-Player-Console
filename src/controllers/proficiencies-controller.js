const RANKS = new Set([0, 1, 2, 3, 4]);
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export class ProficienciesController {
    static #editable(actor) {
        const allowed = actor?.canUserModify?.(game.user, "update") === true;
        if (!allowed) ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.NotEditable"));
        return allowed;
    }

    static async updateRank(actor, { category, slug, itemId, rank }) {
        if (!this.#editable(actor)) return;
        const value = Number(rank);
        if (!Number.isInteger(value) || !RANKS.has(value)) {
            ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Proficiencies.InvalidRank"));
            return;
        }
        if (category === "lore") {
            const item = actor.items?.get?.(itemId);
            if (!item?.isOfType?.("lore")) return;
            return item.update({ "system.proficient.value": value });
        }
        if (!SLUG.test(slug ?? "")) return;
        if (category === "skill" && Object.hasOwn(CONFIG.PF2E.skills ?? {}, slug)) {
            return actor.update({ [`system.skills.${slug}.rank`]: value });
        }
        const source = actor._source?.system?.proficiencies?.attacks?.[slug];
        if (category === "attack" && source?.custom === true) {
            return actor.update({ [`system.proficiencies.attacks.${slug}.rank`]: value });
        }
    }

    static openLore(actor, itemId) {
        const item = actor.items?.get?.(itemId);
        if (item?.isOfType?.("lore")) return item.sheet?.render(true);
    }
}
