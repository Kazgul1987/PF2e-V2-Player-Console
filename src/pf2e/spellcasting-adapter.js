import { LOG_PREFIX } from "../constants.js";

/** Presentation-only normalization of PF2e's prepared spellcasting sheet data. */
export class SpellcastingAdapter {
    static async prepare(actor) {
        const collections = actor?.spellcasting?.collections;
        if (!collections) throw new Error(`${LOG_PREFIX} ActorSpellcasting collections are unavailable`);
        const entries = await Promise.all(collections.map(async (collection) => {
            const data = await collection.entry.getSheetData();
            return this.#entry(data);
        }));
        return { entries: entries.sort((a, b) => a.sort - b.sort), empty: entries.length === 0 };
    }

    static #entry(data) {
        const statistic = data.statistic;
        return {
            id: data.id, name: data.name, sort: data.sort ?? 0, category: game.i18n.localize(CONFIG.PF2E.preparationType?.[data.category] ?? data.category),
            tradition: data.tradition ? game.i18n.localize(CONFIG.PF2E.magicTraditions?.[data.tradition] ?? data.tradition) : null,
            attribute: data.attribute ? game.i18n.localize(CONFIG.PF2E.abilities?.[data.attribute] ?? data.attribute) : null,
            attack: statistic?.check?.mod ?? statistic?.check?.modifier ?? null,
            dc: statistic?.dc?.value ?? null,
            rank: statistic?.rank ?? null,
            isPrepared: !!data.isPrepared, isFlexible: !!data.isFlexible, isRitual: !!data.isRitual,
            isEphemeral: !!data.isEphemeral, canAttack: !!statistic?.check,
            groups: data.groups.map((group) => ({
                id: String(group.id), label: game.i18n.localize(group.label), number: group.number ?? null,
                uses: group.uses ? { value: group.uses.value, max: group.uses.max } : null,
                slots: group.active.map((active, slotIndex) => this.#slot(active, slotIndex, group, data)),
            })),
        };
    }

    static #slot(active, slotIndex, group, entry) {
        if (!active) return { empty: true, slotIndex, expended: false };
        const spell = active.spell;
        const traits = [...(spell.system?.traits?.value ?? [])].map((slug) =>
            game.i18n.localize(CONFIG.PF2E.spellTraits?.[slug] ?? slug));
        return {
            empty: false, slotIndex, expended: !!active.expended, spellId: spell.id, name: spell.name, img: spell.img,
            castRank: active.castRank ?? group.number ?? spell.rank, signature: !!active.signature,
            uses: active.uses ? { value: active.uses.value, max: active.uses.max } : null,
            traits, actionCost: spell.system?.time?.value ?? null,
            preparedSlot: entry.isPrepared && !entry.isFlexible,
        };
    }
}
