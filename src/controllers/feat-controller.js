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
    static dragStart(actor, event, target) {
        const item = this.item(actor, target.dataset.itemId);
        if (item?.isOfType?.("feat") && !item.grantedBy && event.dataTransfer) {
            event.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
        }
    }
    static async drop(actor, event, target) {
        event.preventDefault();
        if (!this.#editable(actor)) return;
        const data = TextEditor.getDragEventData(event);
        const item = await Item.implementation.fromDropData(data);
        if (!item?.isOfType?.("feat")) return;

        const groupId = target.closest("[data-group-id]")?.dataset.groupId;
        const slotData = groupId
            ? { groupId, slotId: target.closest("[data-slot-id]")?.dataset.slotId ?? null }
            : null;
        const sameActor = item.parent?.uuid === actor.uuid;
        const group = groupId === "bonus" ? actor.feats.bonus : actor.feats.get(groupId);

        // Nested grants are prepared as children by PF2e and are not independent move targets.
        if (sameActor && item.grantedBy) return;

        // Core refuses to detach an embedded feat by moving it to a slotted group's non-slot area.
        if (sameActor && group?.slotted && !slotData?.slotId) return [];

        const resorting = sameActor && item.group === group && !group?.slotted;
        if (!resorting) return actor.feats.insertFeat(item, slotData);

        const targetItem = this.item(actor, target.closest("[data-item-id]")?.dataset.itemId);
        if (targetItem && targetItem !== item) {
            const siblings = group.feats.flatMap((entry) => entry.feat && entry.feat !== item ? [entry.feat] : []);
            return item.sortRelative({ target: targetItem, siblings });
        }
    }
}
