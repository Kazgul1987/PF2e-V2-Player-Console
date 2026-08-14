import { RollController } from "./roll-controller.js";

export class SpellcastingController {
    static #collection(actor, id) { return actor?.spellcasting?.collections?.get?.(id) ?? null; }
    static #spell(actor, id) { return actor?.items?.get?.(id) ?? null; }
    static #editable(actor) {
        const allowed = actor?.canUserModify?.(game.user, "update") === true;
        if (!allowed) ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.NotEditable"));
        return allowed;
    }
    static open(actor, id) { return this.#spell(actor, id)?.sheet?.render(true); }
    static chat(actor, id, event) { return this.#spell(actor, id)?.toMessage?.(event); }
    static async summary(actor, id) {
        const spell = this.#spell(actor, id);
        if (!spell) return "";
        return TextEditor.enrichHTML(String(spell.description ?? spell.system?.description?.value ?? ""), {
            async: true, relativeTo: spell, secrets: spell.isOwner,
        });
    }
    static cast(actor, data) {
        if (!this.#editable(actor)) return;
        const collection = this.#collection(actor, data.entryId);
        const spell = collection?.get?.(data.spellId);
        if (!spell) return;
        return collection.entry.cast(spell, { rank: Number(data.rank), slotId: Number(data.slotIndex) });
    }
    static attack(actor, entryId, event) {
        const check = this.#collection(actor, entryId)?.entry?.statistic?.check;
        return check?.roll?.(RollController.eventToRollParams(event));
    }
    static unprepare(actor, data) {
        if (!this.#editable(actor)) return;
        return this.#collection(actor, data.entryId)?.prepareSpell(null, data.groupId, Number(data.slotIndex));
    }
    static expend(actor, data) {
        if (!this.#editable(actor)) return;
        return this.#collection(actor, data.entryId)?.setSlotExpendedState(data.groupId, Number(data.slotIndex), data.expended !== "true");
    }
    static dragStart(actor, event, target) {
        const spell = this.#spell(actor, target.dataset.spellId);
        if (!spell || !event.dataTransfer) return;
        const data = spell.toDragData();
        data.spellFrom = { collectionId: target.dataset.entryId, groupId: target.dataset.groupId, slotIndex: Number(target.dataset.slotIndex) };
        event.dataTransfer.setData("text/plain", JSON.stringify(data));
    }
    static async drop(actor, event, target) {
        event.preventDefault();
        if (!this.#editable(actor) || !target?.closest) return;
        const destination = target.closest("[data-entry-id]")?.dataset;
        if (!destination?.entryId) return;
        const collection = this.#collection(actor, destination.entryId);
        if (!collection) return;
        const data = TextEditor.getDragEventData(event);
        const source = data.spellFrom;
        const slotIndex = Number(destination.slotIndex);
        if (source && source.collectionId === destination.entryId && String(source.groupId) === destination.groupId && Number.isInteger(slotIndex)) {
            return collection.swapSlotPositions(destination.groupId, Number(source.slotIndex), slotIndex);
        }
        const item = await Item.implementation.fromDropData(data);
        if (!item?.isOfType?.("spell")) return;
        if (Number.isInteger(slotIndex) && collection.entry.isPrepared && !collection.entry.isFlexible && item.actor === actor && item.system.location.value === collection.id) {
            return collection.prepareSpell(item, destination.groupId, slotIndex);
        }
        const added = await collection.addSpell(item, { groupId: destination.groupId ?? null });
        if (added && Number.isInteger(slotIndex) && collection.entry.isPrepared && !collection.entry.isFlexible) {
            return collection.prepareSpell(added, destination.groupId, slotIndex);
        }
    }
}
