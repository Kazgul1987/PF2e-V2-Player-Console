import { LOG_PREFIX } from "../constants.js";

/** Presentation-only normalization of CharacterCrafting's prepared runtime data. */
export class CraftingAdapter {
    static async prepare(actor) {
        const crafting = actor?.crafting;
        if (!crafting?.abilities || typeof crafting.getFormulas !== "function") {
            throw new Error(`${LOG_PREFIX} CharacterCrafting runtime API is unavailable`);
        }
        const known = await crafting.getFormulas();
        // Match the Core character sheet: alchemical abilities are included for
        // compatibility even though current Core preparation also marks them daily.
        const hasDailyCrafting = crafting.abilities.some(
            (ability) => ability.isDailyPrep || ability.isAlchemical,
        );
        const abilities = await Promise.all(crafting.abilities.map(async (ability) => {
            const data = await ability.getSheetData();
            return {
                id: data.slug, name: game.i18n.localize(data.label), isPrepared: data.isPrepared,
                isAlchemical: data.isAlchemical, isDailyPrep: data.isDailyPrep,
                insufficient: data.insufficient, maxItemLevel: data.maxItemLevel,
                slots: data.maxSlots ? { remaining: data.remainingSlots, max: data.maxSlots } : null,
                resource: data.resource ? {
                    slug: data.resource.slug, label: game.i18n.localize(data.resource.label),
                    value: data.resource.value, max: data.resource.max, cost: data.resourceCost,
                } : null,
                formulas: data.prepared.map((formula, index) => this.#formula(formula, index)),
            };
        }));
        return {
            abilities, known: known.map((formula) => this.#formula(formula, null)),
            empty: abilities.length === 0 && known.length === 0,
            hasDailyCrafting,
            dailyComplete: !!actor.flags?.pf2e?.dailyCraftingComplete,
        };
    }

    static #formula(formula, index) {
        return {
            index, uuid: formula.uuid, name: formula.item.name, img: formula.item.img,
            level: formula.item.level, dc: formula.dc ?? null, quantity: formula.quantity ?? formula.batchSize,
            batchSize: formula.batchSize, batches: formula.batches ?? null, expended: !!formula.expended,
        };
    }
}
