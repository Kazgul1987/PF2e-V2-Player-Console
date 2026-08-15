import { LOG_PREFIX } from "../constants.js";

/** Presentation-only views over PF2e's prepared effect, condition, and affliction documents. */
export class EffectsAdapter {
    static prepare(actor, editable = false) {
        if (!actor?.conditions || !actor?.itemTypes) throw new Error(`${LOG_PREFIX} PF2e prepared effects are unavailable`);
        const conditions = actor.conditions.active.map((condition) => this.#condition(condition, editable));
        const effects = (actor.itemTypes.effect ?? [])
            .filter((effect) => effect.isIdentified !== false || game.user.isGM)
            .map((effect) => this.#effect(effect, editable));
        const afflictions = (actor.itemTypes.affliction ?? []).map((affliction) => this.#affliction(affliction, editable));
        return { conditions, effects, afflictions, empty: !conditions.length && !effects.length && !afflictions.length, editable };
    }

    static #base(item) {
        const badge = item.badge ?? null;
        return {
            id: item.id,
            name: item.name,
            img: item.img,
            badge: badge ? { type: badge.type, value: badge.label ?? badge.value ?? null } : null,
            traits: [...(item.traits ?? [])].map((slug) => ({ slug, label: game.i18n.localize(CONFIG.PF2E.effectTraits?.[slug] ?? slug) })),
        };
    }

    static #durationLabel(duration) {
        const unit = game.i18n.localize(CONFIG.PF2E.timeUnits?.[duration.unit] ?? duration.unit ?? "");
        return [!["unlimited", "encounter"].includes(duration.unit) ? duration.value : null, unit]
            .filter((value) => value !== null && value !== undefined && value !== "")
            .join(" ");
    }

    static #condition(condition, editable) {
        const persistent = condition.system?.persistent ?? null;
        const mutable = editable && !condition.readonly && !condition.isLocked;
        return {
            ...this.#base(condition),
            slug: condition.slug,
            value: condition.value,
            valued: condition.system?.value?.isValued === true,
            active: condition.active === true,
            locked: condition.isLocked === true,
            readonly: condition.readonly === true,
            mutable,
            canRecover: mutable && condition.slug === "persistent-damage" && !!persistent && typeof condition.rollRecovery === "function",
            persistent: persistent ? {
                formula: persistent.formula,
                damageType: game.i18n.localize(CONFIG.PF2E.damageTypes?.[persistent.damageType] ?? persistent.damageType),
                dc: persistent.dc ?? null,
            } : null,
            breakdown: condition.breakdown ?? null,
        };
    }

    static #effect(effect, editable) {
        const duration = effect.system?.duration ?? {};
        const remaining = effect.remainingDuration;
        const isCounter = effect.system?.badge?.type === "counter";
        const mutable = editable && !effect.grantedBy && !effect.isExpired;
        return {
            ...this.#base(effect),
            expired: effect.isExpired === true,
            unidentified: effect.isIdentified === false,
            granted: !!effect.grantedBy,
            deletable: editable && !effect.grantedBy,
            isCounter,
            canIncrease: mutable && isCounter && typeof effect.increase === "function",
            canDecrease: mutable && isCounter && typeof effect.decrease === "function",
            duration: {
                unit: duration.unit ?? null,
                value: duration.value ?? null,
                label: this.#durationLabel(duration),
                remaining: Number.isFinite(remaining?.remaining) ? remaining.remaining : null,
                hasRemaining: Number.isFinite(remaining?.remaining),
                expired: remaining?.expired === true,
            },
        };
    }

    static #affliction(affliction, editable) {
        const onset = affliction.system?.onset ?? null;
        const remaining = affliction.remainingStageDuration;
        return {
            ...this.#base(affliction),
            stage: affliction.stage,
            maxStage: affliction.maxStage,
            onset: onset ? this.#durationLabel(onset) : null,
            remaining: Number.isFinite(remaining?.remaining) ? remaining.remaining : null,
            mutable: editable && !affliction.isLocked,
        };
    }
}
