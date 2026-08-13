import { LOG_PREFIX } from "../constants.js";

const CARRY_TYPES = new Set(["held", "worn", "stowed", "dropped"]);

export class InventoryController {
    static #editable(actor) {
        const allowed = actor?.canUserModify?.(game.user, "update") === true;
        if (!allowed) ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.NotEditable"));
        return allowed;
    }
    static item(actor, id) { return actor?.inventory?.get?.(id) ?? null; }
    static open(actor, id) { return this.item(actor, id)?.sheet?.render(true); }
    static async remove(actor, id, event) {
        if (!this.#editable(actor)) return;
        const item = this.item(actor, id);
        if (!item) return;
        return event?.ctrlKey || event?.shiftKey ? item.delete() : item.deleteDialog();
    }
    static async create(actor, type) {
        if (!this.#editable(actor)) return;
        if (!CONFIG.PF2E.Item.documentClasses[type] || type === "shield") return;
        const name = game.i18n.localize(`PF2E.NewPlaceholders.${type[0].toUpperCase()}${type.slice(1)}`);
        return actor.createEmbeddedDocuments("Item", [{ type, name }]);
    }
    static async quantity(actor, id, delta, event) {
        if (!this.#editable(actor)) return;
        const item = this.item(actor, id); if (!item) return;
        const magnitude = event?.ctrlKey ? 10 : event?.shiftKey ? 5 : 1;
        return item.update({ "system.quantity": Math.max(0, item.quantity + delta * magnitude) });
    }
    static async uses(actor, id, delta) {
        if (!this.#editable(actor)) return;
        const item = this.item(actor, id); const uses = item?.system?.uses;
        if (!uses || !Number.isFinite(uses.max)) return;
        return item.update({ "system.uses.value": Math.clamp(uses.value + delta, 0, uses.max) });
    }
    static async carry(actor, id, carryType, handsHeld = 0) {
        if (!this.#editable(actor) || !CARRY_TYPES.has(carryType)) return;
        const item = this.item(actor, id); if (!item) return;
        return actor.changeCarryType(item, { carryType, handsHeld: carryType === "held" ? Number(handsHeld) : 0 });
    }
    static async invest(actor, id) {
        if (!this.#editable(actor)) return;
        return actor.toggleInvested(id);
    }
    static async container(actor, id) {
        if (!this.#editable(actor)) return;
        const item = this.item(actor, id);
        if (item?.isOfType?.("backpack")) return item.update({ "system.collapsed": !item.isCollapsed });
    }
    static async consume(actor, id) {
        if (!this.#editable(actor)) return;
        const item = this.item(actor, id);
        if (item?.isOfType?.("consumable")) return item.consume();
    }
    static async coins(actor, denomination, amount, mode) {
        if (!this.#editable(actor) || !["pp", "gp", "sp", "cp"].includes(denomination)) return;
        const value = Math.max(0, Math.floor(Number(amount) || 0));
        if (!value) return;
        return mode === "remove" ? actor.inventory.removeCoins({ [denomination]: value }) : actor.inventory.addCoins({ [denomination]: value });
    }
    static dragStart(actor, event, target) {
        const item = this.item(actor, target.dataset.itemId); if (!item || !event.dataTransfer) return;
        event.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
    }
    static async drop(actor, event, target) {
        event.preventDefault();
        if (!this.#editable(actor)) return;
        const data = TextEditor.getDragEventData(event);
        const item = await Item.implementation.fromDropData(data);
        if (!item?.isOfType?.("physical")) return;
        const container = this.item(actor, target.closest("[data-drop-container]")?.dataset.dropContainer || "");
        if (item.actor?.uuid === actor.uuid) {
            await actor.stowOrUnstow(item, container?.isOfType?.("backpack") ? container : undefined);
            const targetItem = this.item(actor, target.closest("[data-item-id]")?.dataset.itemId);
            if (targetItem && targetItem !== item && targetItem !== container) {
                const siblings = [...(container?.contents ?? actor.inventory)].filter((sibling) => sibling !== item && sibling.container?.id === (container?.id ?? null));
                await item.sortRelative({ target: targetItem, siblings });
            }
            return;
        }
        if (item.actor) return item.actor.transferItemToActor(actor, item, item.quantity, container?.id);
        const source = item.clone().toObject();
        return actor.inventory.add([source], { container: container?.isOfType?.("backpack") ? container : undefined, stack: true });
    }
}
