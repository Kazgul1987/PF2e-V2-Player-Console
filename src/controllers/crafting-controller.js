import { renderItemSummary } from "../pf2e/item-summary.js";

export class CraftingController {
    static #ability(actor, id) { return actor?.crafting?.abilities?.get?.(id) ?? null; }
    static #hasDailyCrafting(crafting) {
        return crafting?.abilities?.some?.((ability) => ability.isDailyPrep || ability.isAlchemical) === true;
    }
    static #editable(actor) {
        const allowed = actor?.canUserModify?.(game.user, "update") === true;
        if (!allowed) ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.NotEditable"));
        return allowed;
    }
    static async #item(uuid) { return typeof uuid === "string" ? fromUuid(uuid) : null; }
    static async open(uuid) { return (await this.#item(uuid))?.sheet?.render(true); }
    static async chat(uuid, event) { return (await this.#item(uuid))?.toMessage?.(event); }
    static async summary(uuid) {
        return renderItemSummary(await this.#item(uuid));
    }
    static prepare(actor, abilityId, uuid) {
        if (!this.#editable(actor)) return;
        return this.#ability(actor, abilityId)?.prepareFormula?.(uuid);
    }
    static unprepare(actor, abilityId, index) {
        if (!this.#editable(actor) || !Number.isInteger(index) || index < 0) return;
        return this.#ability(actor, abilityId)?.unprepareFormula?.(index);
    }
    static quantity(actor, abilityId, index, value) {
        if (!this.#editable(actor) || !Number.isInteger(index) || index < 0) return;
        const quantity = Math.max(0, Math.trunc(Number(value)));
        if (!Number.isFinite(quantity)) return;
        return this.#ability(actor, abilityId)?.setFormulaQuantity?.(index, quantity);
    }
    static craftPrepared(actor, abilityId, index) {
        if (!this.#editable(actor) || !Number.isInteger(index) || index < 0) return;
        return this.#ability(actor, abilityId)?.craft?.(index);
    }
    static craftKnown(actor, uuid, event, quantity = 1) {
        if (!this.#editable(actor)) return;
        const craft = game.pf2e?.actions?.craft;
        if (typeof craft !== "function") return;
        return craft({ uuid, quantity: Math.max(1, Math.trunc(Number(quantity)) || 1), actors: actor, event });
    }
    static daily(actor, reset = false) {
        if (!this.#editable(actor)) return;
        const crafting = actor?.crafting;
        if (!this.#hasDailyCrafting(crafting)) return;
        const dailyComplete = !!actor.flags?.pf2e?.dailyCraftingComplete;
        if (reset !== dailyComplete) return;
        return reset ? crafting.resetDailyCrafting?.() : crafting.performDailyCrafting?.();
    }
    static async drop(actor, event, target) {
        event.preventDefault();
        if (!this.#editable(actor) || !target?.closest) return;
        const abilityId = target.closest("[data-crafting-id]")?.dataset.craftingId;
        if (!abilityId) return;
        const data = TextEditor.getDragEventData(event);
        if (data?.pf2e?.type !== "CraftingFormula" || typeof data.uuid !== "string") return;
        return this.#ability(actor, abilityId)?.prepareFormula?.(data.uuid);
    }
}
