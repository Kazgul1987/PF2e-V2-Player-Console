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

    /** Build the manager view exclusively from Core's preparation sheet data. */
    static async prepareManager(collection) {
        const entry = collection?.entry;
        if (!entry || entry.isPrepared !== true || entry.isFlexible === true || entry.isRitual === true ||
            entry.isSpontaneous === true || entry.isInnate === true || entry.isFocusPool === true) return null;
        const data = await entry.getSheetData({ prepList: true });
        const groups = (data.groups ?? []).map((group) => ({
            id: String(group.id),
            label: game.i18n.localize(group.label),
            number: group.number ?? (group.id === "cantrips" ? 0 : Number(group.id)),
            slots: (group.active ?? []).map((active, slotIndex) => this.#managerSlot(active, slotIndex)),
        })).filter((group) => group.slots.length > 0);
        const knownGroups = Object.entries(data.prepList ?? {}).map(([rank, entries]) => ({
            rank: Number(rank),
            label: groups.find((group) => Number(group.number) === Number(rank))?.label ??
                game.i18n.format("PF2E_V2_PLAYER_CONSOLE.Spellcasting.Rank", { rank }),
            spells: entries.map(({ spell }) => this.#knownSpell(spell)).filter(Boolean),
        })).filter((group) => group.spells.length > 0);
        return { id: entry.id, name: entry.name, groups, knownGroups };
    }

    static #entry(data, focusPool) {
        const statistic = data.statistic;
        const isFocusPool = !!data.isFocusPool;
        const canPrepareSlots = data.isPrepared === true && data.isFlexible !== true && data.isRitual !== true &&
            data.isSpontaneous !== true && data.isInnate !== true && data.isFocusPool !== true;
        return {
            id: data.id, name: data.name, sort: data.sort ?? 0, category: game.i18n.localize(CONFIG.PF2E.preparationType?.[data.category] ?? data.category),
            tradition: data.tradition ? game.i18n.localize(CONFIG.PF2E.magicTraditions?.[data.tradition] ?? data.tradition) : null,
            attribute: data.attribute ? game.i18n.localize(CONFIG.PF2E.abilities?.[data.attribute] ?? data.attribute) : null,
            attack: statistic?.check?.mod ?? statistic?.check?.modifier ?? null,
            dc: statistic?.dc?.value ?? null,
            rank: statistic?.rank ?? null,
            isPrepared: !!data.isPrepared, isFlexible: !!data.isFlexible, isRitual: !!data.isRitual,
            canPrepareSlots,
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
                slots: group.active.map((active, slotIndex) => this.#slot(active, slotIndex, group, canPrepareSlots)),
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

    static #slot(active, slotIndex, group, canPrepareSlots) {
        if (!active) return {
            empty: true, slotIndex, expended: false, isPreparedSlot: canPrepareSlots,
            canPrepare: canPrepareSlots, canUnprepare: false,
        };
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
            isPreparedSlot: canPrepareSlots, canPrepare: false, canUnprepare: canPrepareSlots,
        };
    }

    static #knownSpell(spell) {
        if (!spell) return null;
        const traits = [...(spell.system?.traits?.value ?? [])].map((slug) =>
            game.i18n.localize(CONFIG.PF2E.spellTraits?.[slug] ?? slug));
        return {
            id: spell.id, name: spell.name, img: spell.img, rank: spell.baseRank ?? spell.rank,
            visibleTraits: traits.slice(0, this.MAX_VISIBLE_TRAITS),
            hiddenTraitCount: Math.max(0, traits.length - this.MAX_VISIBLE_TRAITS),
            hiddenTraitLabels: traits.slice(this.MAX_VISIBLE_TRAITS).join(", "),
        };
    }

    static #managerSlot(active, slotIndex) {
        if (!active?.spell) return { slotIndex, displayNumber: slotIndex + 1, empty: true, expended: !!active?.expended };
        return {
            slotIndex, displayNumber: slotIndex + 1, empty: false, expended: !!active.expended,
            spellId: active.spell.id, name: active.spell.name, img: active.spell.img,
        };
    }
}
