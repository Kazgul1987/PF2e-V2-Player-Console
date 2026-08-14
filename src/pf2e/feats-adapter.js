import { LOG_PREFIX } from "../constants.js";

/** A presentation-only view over PF2e's prepared CharacterFeats collection. */
export class FeatsAdapter {
    static prepare(actor) {
        if (!actor?.feats) throw new Error(`${LOG_PREFIX} PF2e CharacterFeats is unavailable`);
        return {
            groups: [...actor.feats, actor.feats.bonus].map((group) => ({
                id: group.id,
                label: game.i18n.localize(group.label),
                slotted: group.slotted,
                entries: group.feats.map((slot) => this.#entry(slot, group)),
            })),
        };
    }

    static #entry(slot, group) {
        return {
            slotId: slot.id ?? null,
            slotLabel: slot.label ?? null,
            placeholder: slot.feat ? null : game.i18n.localize(slot.placeholder ?? "PF2E.EmptySlot"),
            feat: slot.feat ? this.#feat(slot.feat) : null,
            children: (slot.children ?? []).map((child) => this.#entry(child, group)),
            groupId: group.id,
        };
    }

    static #feat(item) {
        const traits = [...(item.system?.traits?.value ?? [])].map((slug) => ({
            slug,
            label: game.i18n.localize(CONFIG.PF2E.featTraits?.[slug] ?? CONFIG.PF2E.actionTraits?.[slug] ?? slug),
        }));
        const cost = item.actionCost ?? null;
        return {
            id: item.id,
            name: item.name,
            img: item.img,
            level: item.level ?? item.system?.level?.value ?? null,
            category: game.i18n.localize(CONFIG.PF2E.featCategories?.[item.category] ?? item.category ?? ""),
            traits,
            actionCost: cost,
        };
    }
}
