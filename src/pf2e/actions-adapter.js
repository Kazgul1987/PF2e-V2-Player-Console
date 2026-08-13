import { LOG_PREFIX } from "../constants.js";

/** A presentation-only view over PF2e's prepared strike and roll-option data. */
export class ActionsAdapter {
    static prepare(actor) {
        if (!Array.isArray(actor?.system?.actions)) {
            throw new Error(`${LOG_PREFIX} Prepared character strikes are unavailable`);
        }

        return {
            strikes: actor.system.actions.map((strike, index) => this.#strike(strike, index)),
            sections: this.#sections(actor),
            toggles: this.#toggles(actor),
            canMutate: actor.canUserModify?.(game.user, "update") === true,
        };
    }

    static #strike(strike, index, altUsageIndex = null) {
        const item = strike.item;
        const ammunition = strike.ammunition ?? null;
        return {
            index,
            altUsageIndex,
            label: strike.label,
            img: item?.img ?? "icons/svg/sword.svg",
            itemId: item?.id ?? null,
            ready: Boolean(strike.ready),
            visible: strike.visible !== false,
            canAttack: Boolean(strike.canAttack),
            dealsDamage: Boolean(item?.dealsDamage),
            handsAvailable: strike.handsAvailable !== false,
            glyph: strike.glyph,
            variants: (strike.variants ?? []).map((variant, variantIndex) => ({
                index: variantIndex,
                label: variant.label,
            })),
            traits: [...(strike.traits ?? []), ...(strike.weaponTraits ?? [])],
            reload: item?.system?.reload?.label ?? null,
            range: item?.system?.maxRange ?? item?.system?.range ?? null,
            versatileOptions: strike.versatileOptions ?? [],
            doubleBarrel: strike.doubleBarrel ?? null,
            ammunition: ammunition && {
                requiresReload: Boolean(ammunition.requiresReload),
                selectedId: ammunition.selected?.id ?? "",
                compatible: (ammunition.compatible ?? []).map((ammo) => ({ id: ammo.id, label: ammo.label })),
                loaded: (ammunition.loaded ?? []).map((ammo) => ({
                    id: ammo.id, name: ammo.name, img: ammo.img, quantity: ammo.quantity,
                    selected: ammo.id === ammunition.selected?.id,
                })),
                remaining: ammunition.remaining ?? 0,
                reloadGlyph: ammunition.reloadGlyph ?? "",
            },
            auxiliaryActions: (strike.auxiliaryActions ?? []).map((action, actionIndex) => ({
                index: actionIndex,
                label: action.label,
                glyph: action.glyph,
                options: action.options ?? [],
            })),
            altUsages: (strike.altUsages ?? []).map((usage, usageIndex) => this.#strike(usage, index, usageIndex)),
        };
    }

    static #sections(actor) {
        const result = {
            action: [], reaction: [], free: [], explorationActive: [], exploration: [], downtime: [],
        };
        const elementalBlast = actor.itemTypes?.action?.find((item) => item.slug === "elemental-blast");
        for (const item of actor.items ?? []) {
            if (!(item.isOfType?.("action") || (item.isOfType?.("feat") && item.actionCost)) || item.suppressed) continue;
            if (actor.flags?.pf2e?.kineticist && item === elementalBlast) continue;
            const traits = item.system?.traits?.value ?? [];
            const data = {
                id: item.id, name: item.name, img: item.img, glyph: this.#actionGlyph(item.actionCost),
                usable: Boolean(item.system?.selfEffect || item.system?.frequency || item.crafting),
                traits: traits.map((slug) => ({ slug, label: CONFIG.PF2E.actionTraits?.[slug] ?? slug })),
                active: actor.system.exploration?.includes(item.id) ?? false,
            };
            if (traits.includes("exploration")) {
                result[data.active ? "explorationActive" : "exploration"].push(data);
            } else if (traits.includes("downtime")) {
                result.downtime.push(data);
            } else {
                result[item.actionCost?.type ?? "free"]?.push(data);
            }
        }
        for (const section of Object.values(result)) section.sort((a, b) => a.name.localeCompare(b.name, game.i18n.lang));
        return result;
    }

    static #actionGlyph(cost) {
        if (!cost) return "";
        if (cost.type === "reaction") return "R";
        if (cost.type === "free") return "F";
        return String(cost.value ?? 1);
    }

    static #toggles(actor) {
        return Object.values(actor.synthetics?.toggles ?? {}).flatMap((domain) => Object.values(domain))
            .filter((toggle) => toggle.placement === "actions")
            .map((toggle) => ({
                itemId: toggle.itemId ?? "", domain: toggle.domain, option: toggle.option,
                label: toggle.label, checked: Boolean(toggle.checked), enabled: toggle.enabled !== false,
                alwaysActive: Boolean(toggle.alwaysActive), suboptions: toggle.suboptions ?? [],
            }));
    }
}
