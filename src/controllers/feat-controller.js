export class FeatController {
    static #editable(actor) {
        const allowed = actor?.canUserModify?.(game.user, "update") === true;
        if (!allowed) ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.NotEditable"));
        return allowed;
    }

    static item(actor, id) { return actor?.items?.get?.(id) ?? null; }
    static open(actor, id) { return this.item(actor, id)?.sheet?.render(true); }
    static toChat(actor, id, event) { return this.item(actor, id)?.toMessage?.(event); }
    static async summary(actor, id) {
        const item = this.item(actor, id);
        if (!item) return "";
        const description = item.description ?? item.system?.description?.value ?? "";
        return TextEditor.enrichHTML(String(description), { async: true, relativeTo: item, secrets: item.isOwner });
    }
    static async remove(actor, id, event) {
        if (!this.#editable(actor)) return;
        const item = this.item(actor, id);
        return event?.ctrlKey || event?.shiftKey ? item?.delete() : item?.deleteDialog();
    }
    static async create(actor) {
        if (!this.#editable(actor)) return;
        return actor.createEmbeddedDocuments("Item", [{
            name: game.i18n.localize(CONFIG.PF2E.featCategories.bonus),
            type: "feat",
            system: { category: "bonus" },
        }]);
    }
    static dragStart(actor, event, target) {
        const item = this.item(actor, target.dataset.itemId);
        if (item?.isOfType?.("feat") && event.dataTransfer) {
            event.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
        }
    }
    static async drop(actor, event, target) {
        event.preventDefault();
        if (!this.#editable(actor)) return;
        const data = TextEditor.getDragEventData(event);
        const item = await Item.implementation.fromDropData(data);
        if (!item?.isOfType?.("feat")) return;
        const entry = target.closest("[data-group-id]");
        const groupId = entry?.dataset.groupId ?? "bonus";
        const group = groupId === "bonus" ? actor.feats.bonus : actor.feats.get(groupId);
        if (!group) return;
        const slotId = target.closest("[data-slot-id]")?.dataset.slotId ?? null;
        if (item.actor?.uuid !== actor.uuid || item.group !== group || group.slotted) {
            return group.insertFeat(item, slotId);
        }
        const targetItem = this.item(actor, target.closest("[data-item-id]")?.dataset.itemId);
        if (targetItem && targetItem !== item) {
            const siblings = group.feats.flatMap((entry) => entry.feat && entry.feat !== item ? [entry.feat] : []);
            return item.sortRelative({ target: targetItem, siblings });
        }
    }
}
