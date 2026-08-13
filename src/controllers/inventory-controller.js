import { PF2E_ITEM_CARRY_TYPES } from "../constants.js";

const CARRY_TYPES = new Set(PF2E_ITEM_CARRY_TYPES);

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
    static async carry(actor, id, carryType, handsHeld = 0, inSlot = false) {
        if (!this.#editable(actor) || !CARRY_TYPES.has(carryType)) return;
        const item = this.item(actor, id); if (!item) return;
        return actor.changeCarryType(item, { carryType, handsHeld: carryType === "held" ? Number(handsHeld) : 0, inSlot: Boolean(inSlot) });
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
    static async toChat(actor, id, event) {
        return this.item(actor, id)?.toMessage?.(event);
    }
    static async summary(actor, id) {
        const item = this.item(actor, id);
        if (!item) return "";
        const description = item.description ?? item.system?.description?.value ?? "";
        return TextEditor.enrichHTML(String(description), { async: true, relativeTo: item, secrets: item.isOwner });
    }
    static async identify(actor, id, status) {
        if (!this.#editable(actor) || !game.user.isGM || !["identified", "unidentified"].includes(status)) return;
        return this.item(actor, id)?.setIdentificationStatus?.(status);
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
        if (item.actor) return this.#transfer(item, actor, container?.id);
        const source = item.clone().toObject();
        return actor.inventory.add([source], { container: container?.isOfType?.("backpack") ? container : undefined, stack: true });
    }

    static async #transfer(item, recipient, containerId) {
        const source = item.actor;
        const purchase = source.isOfType?.("loot") && source.isMerchant;
        // PF2e's transferCredits helper is deliberately not public API. Never
        // pass a credstick to the ordinary physical-item transfer API.
        if (item.isOfType?.("treasure") && item.system.category === "credstick") {
            ui.notifications.warn(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.CredstickTransferUnsupported"));
            return;
        }
        if (!game.user.isGM && !recipient.isLootableBy?.(game.user) && source.isOfType?.("character", "npc")) {
            ui.notifications.warn(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.TradeRequiresCore"));
            return;
        }
        if (purchase && item.isOfType?.("backpack") && item.contents?.size) {
            return ui.notifications.error(game.i18n.localize("PF2E.ErrorMessage.CantPurchaseContainerWithItems"));
        }
        const stackable = Boolean(recipient.inventory.findStackableItem?.(item._source, { containerId }));
        const result = await this.#transferDialog(item, recipient, { purchase, stackable });
        if (!result) return;
        // Core only exposes the merchant gift/move choice to an owner. Guard
        // again here rather than trusting a dialog result assembled in the DOM.
        if (purchase && !result.purchase && !item.isOwner) {
            ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.NotEditable"));
            return;
        }
        return source.transferItemToActor(recipient, item, result.quantity, containerId, result.newStack, result.purchase);
    }

    static async #transferDialog(item, recipient, { purchase, stackable }) {
        const max = Math.max(1, Number(item.quantity) || 1);
        if (max === 1 && !purchase) return { quantity: 1, newStack: false, purchase: false };
        const defaultQuantity = purchase && item.isOfType?.("ammo") ? Math.min(10, max) : purchase ? 1 : max;
        // DialogV2 accepts an HTML string. Avoid binding this sheet-originated
        // workflow to the main window's global document when it is detached.
        const content = `<div class="standard-form"><p>${foundry.utils.escapeHTML(game.i18n.format("PF2E_V2_PLAYER_CONSOLE.Transfer.Prompt", { actor: recipient.name }))}</p>
            <div class="form-group"><label>${game.i18n.localize("PF2E.QuantityLabel")}</label><input name="quantity" type="number" min="1" max="${max}" value="${defaultQuantity}"></div>
            <label class="checkbox"><input name="newStack" type="checkbox" ${stackable ? "" : "disabled"}> ${game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Transfer.NewStack")}</label></div>`;
        const callback = (_event, button) => {
            const form = button.closest("form");
            if (!form) return null;
            const data = new foundry.applications.ux.FormDataExtended(form).object;
            return { quantity: Math.clamp(Math.floor(Number(data.quantity) || 1), 1, max), newStack: Boolean(data.newStack), purchase: button.dataset.action === "purchase" };
        };
        const action = purchase ? "purchase" : "transfer";
        const buttons = [{ action: "cancel", label: "COMMON.Cancel" }];
        if (purchase && item.isOwner) {
            buttons.push({ action: "move", label: "PF2E.ItemTransferDialog.Button.gift", callback });
        }
        buttons.push({ action, label: purchase ? "PF2E.ItemTransferDialog.Button.purchase" : "PF2E_V2_PLAYER_CONSOLE.Transfer.Button", default: true, callback });
        return foundry.applications.api.DialogV2.wait({
            window: { title: game.i18n.format("PF2E_V2_PLAYER_CONSOLE.Transfer.Title", { item: item.name }) },
            content,
            buttons,
        });
    }
}
