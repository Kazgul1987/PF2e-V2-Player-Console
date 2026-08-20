import { LOG_PREFIX } from "../constants.js";

/** Presentation-only normalization of PF2e's prepared spellcasting sheet data. */
export class SpellcastingAdapter {
    static MAX_VISIBLE_TRAITS = 3;

    static async prepare(actor) {
        const collections = actor?.spellcasting?.collections;
        if (!collections) throw new Error(`${LOG_PREFIX} ActorSpellcasting collections are unavailable`);
        const focus = actor.system?.resources?.focus;
        const focusPool = this.#focusPool(focus);
        const entries = await Promise.all(collections.map(async (collection) => {
            const data = await collection.entry.getSheetData();
            return this.#entry(data, focusPool);
        }));
        return { entries: entries.sort((a, b) => a.sort - b.sort), empty: entries.length === 0 };
    }

    static #entry(data, focusPool) {
        const statistic = data.statistic;
        const isFocusPool = !!data.isFocusPool;
        return {
            id: data.id, name: data.name, sort: data.sort ?? 0, category: game.i18n.localize(CONFIG.PF2E.preparationType?.[data.category] ?? data.category),
            tradition: data.tradition ? game.i18n.localize(CONFIG.PF2E.magicTraditions?.[data.tradition] ?? data.tradition) : null,
            attribute: data.attribute ? game.i18n.localize(CONFIG.PF2E.abilities?.[data.attribute] ?? data.attribute) : null,
            attack: statistic?.check?.mod ?? statistic?.check?.modifier ?? null,
            dc: statistic?.dc?.value ?? null,
            rank: statistic?.rank ?? null,
            isPrepared: !!data.isPrepared, isFlexible: !!data.isFlexible, isRitual: !!data.isRitual,
            isFocusPool,
            isEphemeral: !!data.isEphemeral, persisted: !data.isEphemeral && !data.isRitual,
            canAttack: !!statistic?.check,
            groups: data.groups.map((group) => ({
                id: String(group.id), label: game.i18n.localize(group.label), number: group.number ?? null,
                uses: group.uses ? { value: group.uses.value, max: group.uses.max } : null,
                isFocusPool,
                isFocusCantrip: isFocusPool && group.id === "cantrips" && !group.uses,
                focusPool: isFocusPool && group.uses ? focusPool : null,
                editableUses: !!group.uses && !data.isFocusPool && !data.isInnate && !data.isRitual &&
                    !data.isEphemeral && Number.isInteger(group.number),
                editableValue: group.uses?.value !== undefined && group.uses?.value !== null,
                slots: group.active.map((active, slotIndex) => this.#slot(active, slotIndex, group, data)),
            })),
        };
    }

    /** Normalize PF2e's prepared focus resource for presentation without deriving any rules. */
    static #focusPool(focus) {
        const value = Number(focus?.value);
        const max = Number(focus?.max);
        if (!Number.isFinite(value) || !Number.isInteger(max) || max <= 0) return null;
        const current = Math.min(Math.max(Math.trunc(value), 0), max);
        return {
            value: current,
            max,
            points: Array.from({ length: max }, (_, index) => ({ filled: index < current })),
        };
    }

    static #slot(active, slotIndex, group, entry) {
        if (!active) return { empty: true, slotIndex, expended: false };
        const spell = active.spell;
        const traits = [...(spell.system?.traits?.value ?? [])].map((slug) =>
            game.i18n.localize(CONFIG.PF2E.spellTraits?.[slug] ?? slug));
        const visibleTraits = traits.slice(0, this.MAX_VISIBLE_TRAITS);
        const hiddenTraits = traits.slice(this.MAX_VISIBLE_TRAITS);
        return {
            empty: false, slotIndex, expended: !!active.expended, spellId: spell.id, name: spell.name, img: spell.img,
            castRank: active.castRank ?? group.number ?? spell.rank, signature: !!active.signature,
            uses: active.uses ? { value: active.uses.value, max: active.uses.max } : null,
            traits, visibleTraits, hiddenTraits, hiddenTraitCount: hiddenTraits.length,
            hiddenTraitLabels: hiddenTraits.join(", "), actionCost: spell.system?.time?.value ?? null,
            preparedSlot: entry.isPrepared && !entry.isFlexible,
        };
    }
}
