const NUMBER_LIMITS = Object.freeze({
    playerNumber: Object.freeze({ min: 10_000, max: 99_999 }),
    characterNumber: Object.freeze({ min: 2_001, max: 9_999 }),
});

export class PFSController {
    static #editable(actor) {
        const allowed = actor?.canUserModify?.(game.user, "update") === true;
        if (!allowed) ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.NotEditable"));
        return allowed;
    }

    static #factions() { return new Set(Object.keys(CONFIG.PF2E.pfsFactions ?? {})); }
    static #item(actor, id) { return actor?.items?.get?.(id) ?? null; }
    static value(actor, field, faction = null) {
        return faction ? actor?.system?.pfs?.reputation?.[faction] ?? "" : actor?.system?.pfs?.[field] ?? "";
    }

    static async updateOrganizedPlayNumber(actor, field, value) {
        if (!this.#editable(actor) || !Object.hasOwn(NUMBER_LIMITS, field)) return false;
        const parsed = this.#nullableInteger(value);
        const limits = NUMBER_LIMITS[field];
        if (parsed === undefined || (parsed !== null && (parsed < limits.min || parsed > limits.max))) return false;
        await actor.update({ [`system.pfs.${field}`]: parsed });
        return true;
    }

    static async toggleLevelBump(actor, value) {
        if (!this.#editable(actor)) return false;
        await actor.update({ "system.pfs.levelBump": Boolean(value) });
        return true;
    }

    static async updateFaction(actor, faction) {
        if (!this.#editable(actor) || !this.#factions().has(faction)) return false;
        await actor.update({ "system.pfs.currentFaction": faction });
        return true;
    }

    static async updateReputation(actor, faction, value) {
        if (!this.#editable(actor) || !this.#factions().has(faction)) return false;
        const parsed = this.#nullableInteger(value);
        if (parsed === undefined) return false;
        await actor.update({ [`system.pfs.reputation.${faction}`]: parsed });
        return true;
    }

    static open(actor, id) { return this.#item(actor, id)?.sheet?.render(true); }
    static toChat(actor, id, event) { return this.#item(actor, id)?.toMessage?.(event); }
    static async summary(actor, id) {
        const item = this.#item(actor, id);
        if (!item) return "";
        const description = item.description ?? item.system?.description?.value ?? "";
        return TextEditor.enrichHTML(String(description), { async: true, relativeTo: item, secrets: item.isOwner });
    }
    static async remove(actor, id, event) {
        if (!this.#editable(actor)) return;
        const item = this.#item(actor, id);
        if (!item?.isOfType?.("feat") || item.category !== "pfsboon" || item.grantedBy) return;
        return event?.ctrlKey || event?.shiftKey ? item.delete() : item.deleteDialog();
    }

    static async browse(actor) {
        const featTab = game.pf2e?.compendiumBrowser?.tabs?.feat;
        if (!featTab?.getFilterData || !featTab?.open) return;
        const filter = await featTab.getFilterData();
        const level = filter.level;
        if (level && typeof actor.level === "number") {
            level.to = Math.min(actor.level, level.max);
            level.isExpanded = level.to !== level.max;
        }
        const category = filter.checkboxes?.category;
        const boon = category?.options?.pfsboon;
        if (!category || !boon) return;
        category.isExpanded = true;
        boon.selected = true;
        if (!category.selected.includes("pfsboon")) category.selected.push("pfsboon");
        return featTab.open({ filter });
    }

    static dragStart(actor, event, target) {
        const item = this.#item(actor, target.dataset.itemId);
        if (item?.isOfType?.("feat") && item.category === "pfsboon" && !item.grantedBy && event.dataTransfer) {
            event.dataTransfer.setData("text/plain", JSON.stringify(item.toDragData()));
        }
    }

    static async drop(actor, event) {
        event.preventDefault();
        if (!this.#editable(actor)) return;
        const data = TextEditor.getDragEventData(event);
        const item = await Item.implementation.fromDropData(data);
        if (!item?.isOfType?.("feat") || item.category !== "pfsboon") return;
        if (item.parent?.uuid === actor.uuid) return;
        const source = item.toObject();
        delete source._id;
        return actor.createEmbeddedDocuments("Item", [source]);
    }

    static #nullableInteger(value) {
        if (String(value ?? "").trim() === "") return null;
        const parsed = Number(value);
        return Number.isInteger(parsed) ? parsed : undefined;
    }
}
