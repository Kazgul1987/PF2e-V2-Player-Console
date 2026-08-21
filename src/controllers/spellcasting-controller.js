import { RollController } from "./roll-controller.js";
import { renderItemSummary } from "../pf2e/item-summary.js";

export class SpellcastingController {
    static #collection(actor, id) { return actor?.spellcasting?.collections?.get?.(id) ?? null; }
    static #spell(actor, id) { return actor?.items?.get?.(id) ?? null; }
    static #editable(actor, { notify = true } = {}) {
        const allowed = actor?.canUserModify?.(game.user, "update") === true;
        if (!allowed && notify) ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.NotEditable"));
        return allowed;
    }
    static collection(actor, id) { return this.#collection(actor, id); }
    static isEditable(actor, options) { return this.#editable(actor, options); }
    static async #preparedSlot(collection, groupId, slotIndex) {
        if (!collection?.entry || collection.entry.isPrepared !== true || collection.entry.isFlexible === true ||
            collection.entry.isRitual === true || collection.entry.isSpontaneous === true ||
            collection.entry.isInnate === true || collection.entry.isFocusPool === true ||
            !Number.isInteger(slotIndex) || slotIndex < 0) return null;
        const data = await collection.entry.getSheetData();
        const group = data.groups?.find((candidate) => String(candidate.id) === String(groupId));
        return group && slotIndex < group.active.length ? { group, slotIndex } : null;
    }
    static #report(error) { console.warn("PF2e V2 Player Console | Spell preparation was rejected", error); }
    static open(actor, id) { return this.#spell(actor, id)?.sheet?.render(true); }
    static chat(actor, id, event) { return this.#spell(actor, id)?.toMessage?.(event); }
    static async summary(actor, id) {
        return renderItemSummary(this.#spell(actor, id));
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
    static adjustFocus(actor, delta) {
        if (!this.#editable(actor) || ![-1, 1].includes(delta)) return;
        const resource = actor.getResource?.("focus");
        if (!resource || typeof actor.updateResource !== "function") return;
        return actor.updateResource("focus", resource.value + delta);
    }
    static async updateSlotCount(actor, data) {
        if (!this.#editable(actor) || !["value", "max"].includes(data.field)) return;
        const collection = this.#collection(actor, data.entryId);
        const entry = collection?.entry;
        const rank = Number(data.rank);
        const value = Math.max(0, Math.trunc(Number(data.value)));
        if (!entry || entry.isEphemeral || entry.isRitual || entry.type !== "spellcastingEntry" ||
            !Number.isInteger(rank) || rank < 0 || rank > 10 || !Number.isFinite(value)) return;
        return entry.update({ [`system.slots.slot${rank}.${data.field}`]: value });
    }
    static async prepare(actor, data) {
        if (!this.#editable(actor)) return;
        const collection = this.#collection(actor, data.entryId);
        try {
            const target = await this.#preparedSlot(collection, data.groupId, Number(data.slotIndex));
            if (!target || target.group.active[target.slotIndex]) return;
            const sheetData = await collection.entry.getSheetData({ prepList: true });
            const targetRank = data.groupId === "cantrips" ? 0 : Number(data.groupId);
            if (!Number.isInteger(targetRank)) return;
            const choices = Object.entries(sheetData.prepList ?? {})
                .filter(([rank]) => targetRank === 0 ? Number(rank) === 0 : Number(rank) > 0 && Number(rank) <= targetRank)
                .flatMap(([, spells]) => spells.map(({ spell }) => spell))
                .filter((spell, index, all) => spell && all.findIndex((other) => other.id === spell.id) === index);
            if (!choices.length) {
                ui.notifications.info(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Spellcasting.NoKnownSpells"));
                return;
            }
            const options = choices.map((spell) => `<option value="${foundry.utils.escapeHTML(spell.id)}">${foundry.utils.escapeHTML(spell.name)} (${game.i18n.format("PF2E_V2_PLAYER_CONSOLE.Spellcasting.Rank", { rank: spell.rank })})</option>`).join("");
            const spellId = await foundry.applications.api.DialogV2.wait({
                window: { title: game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Spellcasting.Prepare") },
                content: `<div class="standard-form"><label>${game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Spellcasting.KnownSpell")}<select name="spellId">${options}</select></label></div>`,
                buttons: [
                    { action: "prepare", label: game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Spellcasting.Prepare"), icon: "fa-solid fa-plus", default: true,
                        callback: (_event, button) => {
                            const form = button.closest("form");
                            return form ? new foundry.applications.ux.FormDataExtended(form).object.spellId : null;
                        } },
                    { action: "cancel", label: "COMMON.Cancel", icon: "fa-solid fa-xmark", callback: () => null },
                ],
                rejectClose: false,
            });
            const spell = collection.get?.(spellId);
            if (!spell || !await this.#preparedSlot(collection, data.groupId, Number(data.slotIndex))) return;
            return collection.prepareSpell(spell, data.groupId, Number(data.slotIndex));
        } catch (error) { this.#report(error); }
    }
    static async prepareDirect(actor, data) {
        if (!this.#editable(actor)) return;
        const collection = this.#collection(actor, data.entryId);
        try {
            const target = await this.#preparedSlot(collection, data.groupId, Number(data.slotIndex));
            const spell = collection?.get?.(data.spellId);
            if (!target || target.group.active[target.slotIndex] || !spell) return;
            return collection.prepareSpell(spell, data.groupId, Number(data.slotIndex));
        } catch (error) { this.#report(error); }
    }
    static async chooseSpell(actor, data) {
        const collection = this.#collection(actor, data.entryId);
        try {
            const target = await this.#preparedSlot(collection, data.groupId, Number(data.slotIndex));
            if (!target || target.group.active[target.slotIndex]) return null;
            const prepList = (await collection.entry.getSheetData({ prepList: true })).prepList ?? {};
            const rank = data.groupId === "cantrips" ? 0 : Number(data.groupId);
            if (!Number.isInteger(rank)) return null;
            const spells = Object.entries(prepList)
                .filter(([knownRank]) => rank === 0 ? Number(knownRank) === 0 : Number(knownRank) > 0 && Number(knownRank) <= rank)
                .flatMap(([, entries]) => entries.map(({ spell }) => spell)).filter(Boolean);
            return this.#choose(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Spellcasting.ChooseSpell"), "spellId",
                spells.map((spell) => ({ value: spell.id, label: spell.name })));
        } catch (error) { this.#report(error); return null; }
    }
    static async chooseSlot(actor, entryId, spellId) {
        const collection = this.#collection(actor, entryId);
        try {
            const data = await collection?.entry?.getSheetData({ prepList: true });
            const known = Object.entries(data?.prepList ?? {}).flatMap(([rank, entries]) =>
                entries.map(({ spell }) => ({ spell, rank: Number(rank) }))).find(({ spell }) => spell?.id === spellId);
            if (!known) return null;
            const targets = (data.groups ?? []).flatMap((group) => {
                const rank = group.id === "cantrips" ? 0 : Number(group.number ?? group.id);
                if (rank === 0 ? known.rank !== 0 : known.rank === 0 || known.rank > rank) return [];
                return (group.active ?? []).flatMap((active, slotIndex) => active ? [] : [{
                    value: `${group.id}:${slotIndex}`,
                    label: `${game.i18n.localize(group.label)} — ${game.i18n.format("PF2E_V2_PLAYER_CONSOLE.Spellcasting.SlotNumber", { number: slotIndex + 1 })}`,
                }]);
            });
            const selected = await this.#choose(game.i18n.format("PF2E_V2_PLAYER_CONSOLE.Spellcasting.PrepareNamed", { spell: known.spell.name }), "slot", targets);
            if (!selected) return null;
            const separator = selected.lastIndexOf(":");
            return { groupId: selected.slice(0, separator), slotIndex: Number(selected.slice(separator + 1)) };
        } catch (error) { this.#report(error); return null; }
    }
    static async #choose(title, name, choices) {
        if (!choices.length) {
            ui.notifications.info(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Spellcasting.NoEligibleTargets"));
            return null;
        }
        const options = choices.map(({ value, label }) => `<option value="${foundry.utils.escapeHTML(value)}">${foundry.utils.escapeHTML(label)}</option>`).join("");
        return foundry.applications.api.DialogV2.wait({
            window: { title }, content: `<div class="standard-form"><label>${foundry.utils.escapeHTML(title)}<select name="${name}">${options}</select></label></div>`,
            buttons: [{ action: "choose", label: game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Spellcasting.Prepare"), icon: "fa-solid fa-plus", default: true,
                callback: (_event, button) => {
                    const form = button.closest("form");
                    return form ? new foundry.applications.ux.FormDataExtended(form).object[name] : null;
                } }, { action: "cancel", label: game.i18n.localize("Cancel"), icon: "fa-solid fa-xmark", callback: () => null }],
            rejectClose: false,
        });
    }
    static async openPreparationManager(actor, entryId) {
        if (!this.#editable(actor)) return;
        const collection = this.#collection(actor, entryId);
        if (!await this.#preparedSlotEntry(collection)) return;
        const { SpellPreparationManager } = await import("../app/spell-preparation/spell-preparation-manager.js");
        return new SpellPreparationManager({ actor, entryId }).render({ force: true });
    }
    static async #preparedSlotEntry(collection) {
        const entry = collection?.entry;
        return !!entry && entry.isPrepared === true && entry.isFlexible !== true && entry.isRitual !== true &&
            entry.isSpontaneous !== true && entry.isInnate !== true && entry.isFocusPool !== true;
    }
    static async unprepare(actor, data) {
        if (!this.#editable(actor)) return;
        const collection = this.#collection(actor, data.entryId);
        try {
            if (!await this.#preparedSlot(collection, data.groupId, Number(data.slotIndex))) return;
            return collection.prepareSpell(null, data.groupId, Number(data.slotIndex));
        } catch (error) { this.#report(error); }
    }
    static async expend(actor, data) {
        if (!this.#editable(actor)) return;
        const collection = this.#collection(actor, data.entryId);
        try {
            if (!await this.#preparedSlot(collection, data.groupId, Number(data.slotIndex))) return;
            return collection.setSlotExpendedState(data.groupId, Number(data.slotIndex), data.expended !== "true");
        } catch (error) { this.#report(error); }
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
        const sourceSlotIndex = Number(source?.slotIndex);
        const slotIndex = Number(destination.slotIndex);
        const canSwapPreparedSlots = collection.entry.isPrepared === true &&
            collection.entry.isFlexible === false && collection.entry.isRitual !== true;
        const validSourceSlot = Number.isInteger(sourceSlotIndex) && sourceSlotIndex >= 0;
        const validTargetSlot = Number.isInteger(slotIndex) && slotIndex >= 0;
        if (canSwapPreparedSlots && validTargetSlot) {
            try {
                if (!await this.#preparedSlot(collection, destination.groupId, slotIndex)) return;
            } catch (error) { this.#report(error); return; }
        }
        if (canSwapPreparedSlots && validSourceSlot && validTargetSlot && source?.collectionId === destination.entryId &&
            String(source.groupId) === destination.groupId) {
            try {
                if (!await this.#preparedSlot(collection, destination.groupId, slotIndex) ||
                    !await this.#preparedSlot(collection, source.groupId, sourceSlotIndex)) return;
                return collection.swapSlotPositions(destination.groupId, sourceSlotIndex, slotIndex);
            } catch (error) { this.#report(error); return; }
        }
        const item = await Item.implementation.fromDropData(data);
        if (!item?.isOfType?.("spell")) return;
        if (Number.isInteger(slotIndex) && collection.entry.isPrepared && !collection.entry.isFlexible && item.actor === actor && item.system.location.value === collection.id) {
            try {
                if (!await this.#preparedSlot(collection, destination.groupId, slotIndex)) return;
                return collection.prepareSpell(item, destination.groupId, slotIndex);
            } catch (error) { this.#report(error); return; }
        }
        const added = await collection.addSpell(item, { groupId: destination.groupId ?? null });
        if (added && Number.isInteger(slotIndex) && collection.entry.isPrepared && !collection.entry.isFlexible) {
            try {
                if (!await this.#preparedSlot(collection, destination.groupId, slotIndex)) return;
                return collection.prepareSpell(added, destination.groupId, slotIndex);
            } catch (error) { this.#report(error); }
        }
    }
}
