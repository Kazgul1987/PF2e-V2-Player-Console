import { renderItemSummary } from "../pf2e/item-summary.js";

export class ActionController {
    static #strike(actor, index, altUsageIndex = null) {
        const strike = actor.system.actions?.at(Number(index)) ?? null;
        return altUsageIndex === null || altUsageIndex === undefined || altUsageIndex === ""
            ? strike
            : strike?.altUsages?.at(Number(altUsageIndex)) ?? null;
    }

    static async attack(actor, data, event) {
        const strike = this.#strike(actor, data.strikeIndex, data.altUsageIndex);
        if (!strike?.ready) return;
        return strike.variants?.at(Number(data.variantIndex))?.roll({ event });
    }

    static async damage(actor, data, event, critical = false) {
        const strike = this.#strike(actor, data.strikeIndex, data.altUsageIndex);
        return strike?.[critical ? "critical" : "damage"]?.({ event });
    }

    static async auxiliary(actor, data, selection = null) {
        if (!this.#editable(actor)) return;
        const strike = this.#strike(actor, data.strikeIndex, data.altUsageIndex);
        return strike?.auxiliaryActions?.at(Number(data.auxiliaryIndex))?.execute({ selection });
    }

    static async ammo(actor, data, ammoId) {
        if (!this.#editable(actor)) return;
        const weapon = this.#strike(actor, data.strikeIndex, data.altUsageIndex)?.item;
        const ammo = actor.items.get(ammoId);
        return weapon?.update({ "system.selectedAmmoId": ammo?.id ?? null });
    }

    static async weaponTrait(actor, data) {
        if (!this.#editable(actor)) return;
        const weapon = this.#strike(actor, data.strikeIndex, data.altUsageIndex)?.item;
        const trait = data.trait;
        if (!weapon?.system?.traits?.toggles) return;
        if (trait === "double-barrel" && weapon.traits?.has("double-barrel")) {
            return weapon.system.traits.toggles.update({ trait, selected: !weapon.system.traits.toggles.doubleBarrel.selected });
        }
        if (trait === "versatile") {
            const selected = data.active === "true" || data.selected === weapon.system.damage?.damageType ? null : data.selected;
            return weapon.system.traits.toggles.update({ trait, selected });
        }
    }

    static openItem(actor, id) { return actor.items.get(id)?.sheet?.render(true); }
    static toChat(actor, id, event) { return actor.items.get(id)?.toMessage?.(event); }

    static async use(actor, id, event) {
        const item = actor.items.get(id);
        const action = item?.slug && game.pf2e.actions?.[item.slug];
        return typeof action === "function" ? action({ event, actors: [actor] }) : item?.toMessage?.(event);
    }

    static async summary(actor, id) {
        return renderItemSummary(actor.items.get(id));
    }

    static async toggleExploration(actor, id) {
        if (!this.#editable(actor)) return;
        const exploration = actor.system.exploration.filter((itemId) => actor.items.has(itemId));
        const index = exploration.indexOf(id);
        if (index === -1) exploration.push(id); else exploration.splice(index, 1);
        return actor.update({ "system.exploration": exploration });
    }

    static async toggleRollOption(actor, data, checked, suboption = null) {
        if (!this.#editable(actor)) return;
        return actor.toggleRollOption(data.domain, data.option, data.itemId || null, checked, suboption);
    }

    static #editable(actor) {
        const editable = actor.canUserModify?.(game.user, "update") === true;
        if (!editable) ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.NotEditable"));
        return editable;
    }
}
