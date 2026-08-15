import { LOG_PREFIX, MODULE_ID, TABS } from "../../constants.js";
import { CharacterAdapter } from "../../pf2e/character-adapter.js";
import { RollController } from "../../controllers/roll-controller.js";
import { InventoryAdapter } from "../../pf2e/inventory-adapter.js";
import { InventoryController } from "../../controllers/inventory-controller.js";
import { ActionsAdapter } from "../../pf2e/actions-adapter.js";
import { ActionController } from "../../controllers/action-controller.js";
import { FeatsAdapter } from "../../pf2e/feats-adapter.js";
import { FeatController } from "../../controllers/feat-controller.js";
import { SpellcastingAdapter } from "../../pf2e/spellcasting-adapter.js";
import { SpellcastingController } from "../../controllers/spellcasting-controller.js";
import { CraftingAdapter } from "../../pf2e/crafting-adapter.js";
import { CraftingController } from "../../controllers/crafting-controller.js";
import { ProficienciesAdapter } from "../../pf2e/proficiencies-adapter.js";
import { ProficienciesController } from "../../controllers/proficiencies-controller.js";
import { EffectsAdapter } from "../../pf2e/effects-adapter.js";
import { EffectsController } from "../../controllers/effects-controller.js";
import { BiographyAdapter } from "../../pf2e/biography-adapter.js";
import { BiographyController } from "../../controllers/biography-controller.js";

const { DocumentSheetV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class PF2eCharacterSheetV2 extends HandlebarsApplicationMixin(DocumentSheetV2) {
    static DEFAULT_OPTIONS = {
        id: `${MODULE_ID}-{id}`,
        classes: [MODULE_ID, "pf2e-v2-character-sheet"],
        window: {
            frame: true,
            positioned: true,
            resizable: true,
            minimizable: true,
        },
        position: { width: 920, height: 760 },
        actions: {
            detach: PF2eCharacterSheetV2.#detach,
            rollStatistic: PF2eCharacterSheetV2.#rollStatistic,
            openItem: PF2eCharacterSheetV2.#inventoryAction,
            deleteItem: PF2eCharacterSheetV2.#inventoryAction,
            createItem: PF2eCharacterSheetV2.#inventoryAction,
            quantity: PF2eCharacterSheetV2.#inventoryAction,
            uses: PF2eCharacterSheetV2.#inventoryAction,
            carry: PF2eCharacterSheetV2.#inventoryAction,
            invest: PF2eCharacterSheetV2.#inventoryAction,
            toggleContainer: PF2eCharacterSheetV2.#inventoryAction,
            consume: PF2eCharacterSheetV2.#inventoryAction,
            coins: PF2eCharacterSheetV2.#inventoryAction,
            itemSummary: PF2eCharacterSheetV2.#inventoryAction,
            itemToChat: PF2eCharacterSheetV2.#inventoryAction,
            identification: PF2eCharacterSheetV2.#inventoryAction,
            strikeAttack: PF2eCharacterSheetV2.#actionAction,
            strikeDamage: PF2eCharacterSheetV2.#actionAction,
            strikeCritical: PF2eCharacterSheetV2.#actionAction,
            strikeAuxiliary: PF2eCharacterSheetV2.#actionAction,
            toggleWeaponTrait: PF2eCharacterSheetV2.#actionAction,
            openActionItem: PF2eCharacterSheetV2.#actionAction,
            sendActionToChat: PF2eCharacterSheetV2.#actionAction,
            useActionItem: PF2eCharacterSheetV2.#actionAction,
            actionSummary: PF2eCharacterSheetV2.#actionAction,
            toggleExploration: PF2eCharacterSheetV2.#actionAction,
            openFeat: PF2eCharacterSheetV2.#featAction,
            featToChat: PF2eCharacterSheetV2.#featAction,
            featSummary: PF2eCharacterSheetV2.#featAction,
            deleteFeat: PF2eCharacterSheetV2.#featAction,
            castSpell: PF2eCharacterSheetV2.#spellAction,
            openSpell: PF2eCharacterSheetV2.#spellAction,
            spellToChat: PF2eCharacterSheetV2.#spellAction,
            spellSummary: PF2eCharacterSheetV2.#spellAction,
            unprepareSpell: PF2eCharacterSheetV2.#spellAction,
            toggleSlotExpended: PF2eCharacterSheetV2.#spellAction,
            spellAttack: PF2eCharacterSheetV2.#spellAction,
            openFormula: PF2eCharacterSheetV2.#craftingAction,
            formulaToChat: PF2eCharacterSheetV2.#craftingAction,
            formulaSummary: PF2eCharacterSheetV2.#craftingAction,
            prepareFormula: PF2eCharacterSheetV2.#craftingAction,
            unprepareFormula: PF2eCharacterSheetV2.#craftingAction,
            craftFormula: PF2eCharacterSheetV2.#craftingAction,
            performDailyCrafting: PF2eCharacterSheetV2.#craftingAction,
            resetDailyCrafting: PF2eCharacterSheetV2.#craftingAction,
            openLore: PF2eCharacterSheetV2.#proficiencyAction,
            effectSummary: PF2eCharacterSheetV2.#effectsAction,
            openEffect: PF2eCharacterSheetV2.#effectsAction,
            effectToChat: PF2eCharacterSheetV2.#effectsAction,
            deleteEffect: PF2eCharacterSheetV2.#effectsAction,
            increaseEffect: PF2eCharacterSheetV2.#effectsAction,
            decreaseEffect: PF2eCharacterSheetV2.#effectsAction,
            recoverPersistentDamage: PF2eCharacterSheetV2.#effectsAction,
            increaseCondition: PF2eCharacterSheetV2.#effectsAction,
            decreaseCondition: PF2eCharacterSheetV2.#effectsAction,
            removeCondition: PF2eCharacterSheetV2.#effectsAction,
            increaseAffliction: PF2eCharacterSheetV2.#effectsAction,
            decreaseAffliction: PF2eCharacterSheetV2.#effectsAction,
            toggleBiographyVisibility: PF2eCharacterSheetV2.#biographyAction,
            addBiographyListEntry: PF2eCharacterSheetV2.#biographyAction,
            deleteBiographyListEntry: PF2eCharacterSheetV2.#biographyAction,
        },
    };

    static TABS = {
        primary: {
            initial: "character",
            tabs: TABS.map((id) => ({ id })),
            labelPrefix: "PF2E_V2_PLAYER_CONSOLE.Tabs",
        },
    };

    static PARTS = {
        header: { template: `modules/${MODULE_ID}/src/templates/character-sheet/header.hbs` },
        navigation: { template: `modules/${MODULE_ID}/src/templates/character-sheet/navigation.hbs` },
        character: { template: `modules/${MODULE_ID}/src/templates/character-sheet/character.hbs`, scrollable: [""] },
        actions: { template: `modules/${MODULE_ID}/src/templates/character-sheet/actions.hbs`, scrollable: [""] },
        inventory: { template: `modules/${MODULE_ID}/src/templates/character-sheet/inventory.hbs`, scrollable: [""] },
        spellcasting: { template: `modules/${MODULE_ID}/src/templates/character-sheet/spellcasting.hbs`, scrollable: [""] },
        crafting: { template: `modules/${MODULE_ID}/src/templates/character-sheet/crafting.hbs`, scrollable: [""] },
        proficiencies: { template: `modules/${MODULE_ID}/src/templates/character-sheet/proficiencies.hbs`, scrollable: [""] },
        feats: { template: `modules/${MODULE_ID}/src/templates/character-sheet/feats.hbs`, scrollable: [""] },
        effects: { template: `modules/${MODULE_ID}/src/templates/character-sheet/effects.hbs`, scrollable: [""] },
        biography: { template: `modules/${MODULE_ID}/src/templates/character-sheet/biography.hbs`, scrollable: [""] },
        pfs: { template: `modules/${MODULE_ID}/src/templates/character-sheet/pfs.hbs`, scrollable: [""] },
    };

    tabGroups = { primary: "character" };

    constructor(options = {}) {
        const actor = options.document;
        if (!CharacterAdapter.supports(actor)) throw new Error(`${LOG_PREFIX} Cannot open a non-character Actor`);
        super(options);
    }

    get actor() {
        return this.document;
    }

    get title() {
        return game.i18n.format("PF2E_V2_PLAYER_CONSOLE.Labels.SheetTitle", { name: this.actor.name });
    }

    async _prepareContext(options) {
        return {
            ...(await super._prepareContext(options)),
            actor: CharacterAdapter.prepare(this.actor),
            tabs: this._prepareTabs("primary"),
            editable: this.isEditable,
        };
    }

    async _preparePartContext(partId, context, options) {
        const partContext = await super._preparePartContext(partId, context, options);
        if (TABS.includes(partId)) {
            partContext.tab = context.tabs[partId];
        }
        if (partId === "inventory") partContext.inventory = InventoryAdapter.prepare(this.actor);
        if (partId === "actions") partContext.actions = ActionsAdapter.prepare(this.actor);
        if (partId === "feats") partContext.feats = FeatsAdapter.prepare(this.actor);
        if (partId === "spellcasting") partContext.spellcasting = await SpellcastingAdapter.prepare(this.actor);
        if (partId === "crafting") partContext.crafting = await CraftingAdapter.prepare(this.actor);
        if (partId === "proficiencies") partContext.proficiencies = ProficienciesAdapter.prepare(this.actor, this.isEditable);
        if (partId === "effects") partContext.effects = EffectsAdapter.prepare(this.actor, this.isEditable);
        if (partId === "biography") partContext.biography = await BiographyAdapter.prepare(this.actor, this.isEditable);
        return partContext;
    }

    _headerControlButtons() {
        const controls = super._headerControlButtons();
        return (function* (app) {
            yield { icon: "fa-solid fa-up-right-from-square", label: "PF2E_V2_PLAYER_CONSOLE.Actions.Detach", action: "detach", visible: true };
            yield* controls;
        })(this);
    }

    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);
        this.#registerDocumentHooks();
    }

    async _onClose(options) {
        for (const [hook, id] of this.#hooks) Hooks.off(hook, id);
        this.#hooks.length = 0;
        await super._onClose(options);
    }

    static #detach() {
        if (typeof this.detachWindow === "function") return this.detachWindow();
        console.warn(`${LOG_PREFIX} detachWindow is not available in this Foundry distribution`, { application: this });
        ui.notifications.warn(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.DetachUnavailable"));
    }

    static async #rollStatistic(event, target) {
        await RollController.rollStatistic(this.actor, target.dataset.statistic, event, {
            secret: Object.hasOwn(target.dataset, "secret"),
        });
    }

    static async #inventoryAction(event, target) {
        const id = target.closest("[data-item-id]")?.dataset.itemId;
        switch (target.dataset.action) {
            case "openItem": return InventoryController.open(this.actor, id);
            case "deleteItem": return InventoryController.remove(this.actor, id, event);
            case "createItem": return InventoryController.create(this.actor, target.dataset.itemType);
            case "quantity": return InventoryController.quantity(this.actor, id, Number(target.dataset.delta), event);
            case "uses": return InventoryController.uses(this.actor, id, Number(target.dataset.delta));
            case "carry": return InventoryController.carry(this.actor, id, target.dataset.carryType, target.dataset.handsHeld, Object.hasOwn(target.dataset, "inSlot"));
            case "invest": return InventoryController.invest(this.actor, id);
            case "toggleContainer": return InventoryController.container(this.actor, id);
            case "consume": return InventoryController.consume(this.actor, id);
            case "itemToChat": return InventoryController.toChat(this.actor, id, event);
            case "identification": return InventoryController.identify(this.actor, id, target.dataset.status);
            case "itemSummary": {
                const row = target.closest("[data-item-id]");
                const summary = row?.querySelector(":scope > .item-summary");
                if (!summary) return;
                if (!summary.hidden) { summary.hidden = true; summary.replaceChildren(); return; }
                summary.innerHTML = await InventoryController.summary(this.actor, id);
                summary.hidden = false;
                return;
            }
            case "coins": {
                const row = target.closest("[data-denomination]");
                return InventoryController.coins(this.actor, row?.dataset.denomination, row?.querySelector("input")?.value, target.dataset.mode);
            }
        }
    }

    static async #actionAction(event, target) {
        const strike = target.closest("[data-strike-index]")?.dataset ?? {};
        const id = target.closest("[data-item-id]")?.dataset.itemId ?? target.dataset.itemId;
        const data = { ...strike, ...target.dataset };
        switch (target.dataset.action) {
            case "strikeAttack": return ActionController.attack(this.actor, data, event);
            case "strikeDamage": return ActionController.damage(this.actor, data, event);
            case "strikeCritical": return ActionController.damage(this.actor, data, event, true);
            case "strikeAuxiliary": return ActionController.auxiliary(this.actor, data, target.parentElement?.querySelector("[data-auxiliary-selection]")?.value ?? null);
            case "toggleWeaponTrait": return ActionController.weaponTrait(this.actor, data);
            case "openActionItem": return ActionController.openItem(this.actor, id);
            case "sendActionToChat": return ActionController.toChat(this.actor, id, event);
            case "useActionItem": return ActionController.use(this.actor, id, event);
            case "toggleExploration": return ActionController.toggleExploration(this.actor, id);
            case "actionSummary": {
                const summary = target.closest("[data-item-id]")?.querySelector(":scope > .item-summary");
                if (!summary) return;
                if (!summary.hidden) { summary.hidden = true; summary.replaceChildren(); return; }
                summary.innerHTML = await ActionController.summary(this.actor, id);
                summary.hidden = false;
            }
        }
    }

    static async #featAction(event, target) {
        const row = target.closest("[data-item-id]");
        const id = row?.dataset.itemId;
        switch (target.dataset.action) {
            case "openFeat": return FeatController.open(this.actor, id);
            case "featToChat": return FeatController.toChat(this.actor, id, event);
            case "deleteFeat": return FeatController.remove(this.actor, id, event);
            case "featSummary": {
                const summary = row?.querySelector(":scope > .item-summary");
                if (!summary) return;
                if (!summary.hidden) { summary.hidden = true; summary.replaceChildren(); return; }
                summary.innerHTML = await FeatController.summary(this.actor, id);
                summary.hidden = false;
            }
        }
    }

    static async #spellAction(event, target) {
        const row = target.closest("[data-entry-id]");
        const data = { ...row?.dataset, ...target.dataset };
        switch (target.dataset.action) {
            case "castSpell": return SpellcastingController.cast(this.actor, data);
            case "openSpell": return SpellcastingController.open(this.actor, data.spellId);
            case "spellToChat": return SpellcastingController.chat(this.actor, data.spellId, event);
            case "unprepareSpell": return SpellcastingController.unprepare(this.actor, data);
            case "toggleSlotExpended": return SpellcastingController.expend(this.actor, data);
            case "spellAttack": return SpellcastingController.attack(this.actor, data.entryId, event);
            case "spellSummary": {
                const summary = row?.querySelector(":scope > .item-summary");
                if (!summary) return;
                if (!summary.hidden) { summary.hidden = true; summary.replaceChildren(); return; }
                summary.innerHTML = await SpellcastingController.summary(this.actor, data.spellId);
                summary.hidden = false;
            }
        }
    }

    static async #craftingAction(event, target) {
        const row = target.closest("[data-formula-uuid]");
        const ability = target.closest("[data-crafting-id]")?.dataset.craftingId ?? target.dataset.craftingId;
        const uuid = row?.dataset.formulaUuid ?? target.dataset.formulaUuid;
        const index = Number(row?.dataset.formulaIndex);
        switch (target.dataset.action) {
            case "openFormula": return CraftingController.open(uuid);
            case "formulaToChat": return CraftingController.chat(uuid, event);
            case "prepareFormula": return CraftingController.prepare(this.actor, ability, uuid);
            case "unprepareFormula": return CraftingController.unprepare(this.actor, ability, index);
            case "craftFormula": return Number.isInteger(index)
                ? CraftingController.craftPrepared(this.actor, ability, index)
                : CraftingController.craftKnown(this.actor, uuid, event, row?.dataset.craftQuantity);
            case "performDailyCrafting": return CraftingController.daily(this.actor);
            case "resetDailyCrafting": return CraftingController.daily(this.actor, true);
            case "formulaSummary": {
                const summary = row?.querySelector(":scope > .item-summary");
                if (!summary) return;
                if (!summary.hidden) { summary.hidden = true; summary.replaceChildren(); return; }
                summary.innerHTML = await CraftingController.summary(uuid);
                summary.hidden = false;
            }
        }
    }

    static #proficiencyAction(_event, target) {
        if (target.dataset.action === "openLore") {
            return ProficienciesController.openLore(this.actor, target.closest("[data-item-id]")?.dataset.itemId);
        }
    }

    static async #effectsAction(event, target) {
        const row = target.closest("[data-item-id]");
        const id = row?.dataset.itemId;
        switch (target.dataset.action) {
            case "openEffect": return EffectsController.open(this.actor, id);
            case "effectToChat": return EffectsController.chat(this.actor, id, event);
            case "deleteEffect": return EffectsController.removeEffect(this.actor, id, event);
            case "increaseEffect": return EffectsController.changeEffect(this.actor, id, 1);
            case "decreaseEffect": return EffectsController.changeEffect(this.actor, id, -1);
            case "recoverPersistentDamage": return EffectsController.recoverPersistentDamage(this.actor, id);
            case "increaseCondition": return EffectsController.increaseCondition(this.actor, id);
            case "decreaseCondition": return EffectsController.decreaseCondition(this.actor, id);
            case "removeCondition": return EffectsController.removeCondition(this.actor, id);
            case "increaseAffliction": return EffectsController.changeAffliction(this.actor, id, 1);
            case "decreaseAffliction": return EffectsController.changeAffliction(this.actor, id, -1);
            case "effectSummary": {
                const summary = row?.querySelector(":scope > .item-summary");
                if (!summary) return;
                if (!summary.hidden) { summary.hidden = true; summary.replaceChildren(); return; }
                summary.innerHTML = await EffectsController.summary(this.actor, id);
                summary.hidden = false;
            }
        }
    }

    static async #biographyAction(_event, target) {
        const row = target.closest("[data-biography-list]");
        switch (target.dataset.action) {
            case "toggleBiographyVisibility": return BiographyController.toggleVisibility(this.actor, target.dataset.section);
            case "addBiographyListEntry": return BiographyController.addListEntry(this.actor, row?.dataset.biographyList);
            case "deleteBiographyListEntry": return BiographyController.deleteListEntry(this.actor, row?.dataset.biographyList, Number(target.dataset.index));
        }
    }

    async _onRender(context, options) {
        await super._onRender(context, options);
        this.#renderListeners?.abort();
        this.#renderListeners = new AbortController();
        const listenerOptions = { signal: this.#renderListeners.signal };
        const getTabPanel = (tab) => this.element.querySelector(
            `.tab-panel[data-group="primary"][data-tab="${tab}"]`,
        );
        const nameInput = this.element.querySelector('[data-actor-name]');
        nameInput?.addEventListener("change", (event) => void this.#updateActorName(event.currentTarget), listenerOptions);
        nameInput?.addEventListener("keydown", (event) => {
            if (event.key === "Enter") {
                event.preventDefault();
                event.currentTarget.blur();
            } else if (event.key === "Escape") {
                event.preventDefault();
                event.currentTarget.value = this.actor.name;
                event.currentTarget.blur();
            }
        }, listenerOptions);
        const actions = getTabPanel("actions");
        actions?.addEventListener("change", (event) => {
            const target = event.target;
            if (!target?.matches?.("input, select")) return;
            const row = target.closest("[data-domain][data-option]");
            if (row && ["toggleRollOption", "toggleRollOptionSuboption"].includes(target.dataset.action)) {
                const checkbox = row.querySelector('input[data-action="toggleRollOption"]');
                const select = row.querySelector('select[data-action="toggleRollOptionSuboption"]');
                void ActionController.toggleRollOption(this.actor, row.dataset, checkbox?.checked ?? false, select?.value ?? null);
                return;
            }
            if (target.dataset.action === "selectStrikeAmmo") {
                void ActionController.ammo(this.actor, target.closest("[data-strike-index]")?.dataset ?? {}, target.value);
            }
        }, listenerOptions);
        const inventory = getTabPanel("inventory");
        inventory?.addEventListener("dragstart", (event) => {
            const target = event.target.closest("[draggable][data-item-id]");
            if (target) InventoryController.dragStart(this.actor, event, target);
        }, listenerOptions);
        inventory?.addEventListener("dragover", (event) => event.preventDefault(), listenerOptions);
        inventory?.addEventListener("drop", (event) => void InventoryController.drop(this.actor, event, event.target), listenerOptions);
        const feats = getTabPanel("feats");
        feats?.addEventListener("dragstart", (event) => {
            const target = event.target.closest("[draggable][data-item-id]");
            if (target) FeatController.dragStart(this.actor, event, target);
        }, listenerOptions);
        feats?.addEventListener("dragover", (event) => event.preventDefault(), listenerOptions);
        feats?.addEventListener("drop", (event) => void FeatController.drop(this.actor, event, event.target), listenerOptions);
        const spellcasting = getTabPanel("spellcasting");
        spellcasting?.addEventListener("dragstart", (event) => {
            const target = event.target?.closest?.("[draggable][data-spell-id]");
            if (target) SpellcastingController.dragStart(this.actor, event, target);
        }, listenerOptions);
        spellcasting?.addEventListener("dragover", (event) => event.preventDefault(), listenerOptions);
        spellcasting?.addEventListener("drop", (event) => void SpellcastingController.drop(this.actor, event, event.target), listenerOptions);
        spellcasting?.addEventListener("change", (event) => {
            const input = event.target;
            if (!input?.matches?.("[data-slot-count]")) return;
            void SpellcastingController.updateSlotCount(this.actor, { ...input.closest("[data-entry-id]")?.dataset, ...input.dataset, value: input.value });
        }, listenerOptions);
        spellcasting?.addEventListener("keydown", (event) => {
            const input = event.target;
            if (!input?.matches?.("[data-slot-count]")) return;
            if (event.key === "Enter") { event.preventDefault(); input.blur(); }
            if (event.key === "Escape") { event.preventDefault(); input.value = input.defaultValue; input.blur(); }
        }, listenerOptions);
        const crafting = getTabPanel("crafting");
        crafting?.addEventListener("change", (event) => {
            const input = event.target;
            if (!input?.matches?.("[data-formula-quantity]")) return;
            const row = input.closest("[data-formula-index]");
            void CraftingController.quantity(this.actor, row?.closest("[data-crafting-id]")?.dataset.craftingId, Number(row?.dataset.formulaIndex), input.value);
        }, listenerOptions);
        crafting?.addEventListener("keydown", (event) => {
            const input = event.target;
            if (!input?.matches?.("[data-formula-quantity]")) return;
            if (event.key === "Enter") { event.preventDefault(); input.blur(); }
            if (event.key === "Escape") { event.preventDefault(); input.value = input.defaultValue; input.blur(); }
        }, listenerOptions);
        crafting?.addEventListener("dragover", (event) => event.preventDefault(), listenerOptions);
        crafting?.addEventListener("drop", (event) => void CraftingController.drop(this.actor, event, event.target), listenerOptions);
        const proficiencies = getTabPanel("proficiencies");
        proficiencies?.addEventListener("change", async (event) => {
            const select = event.target;
            if (!select?.matches?.("[data-rank-control]")) return;
            await ProficienciesController.updateRank(this.actor, { ...select.dataset, rank: Number(select.value) });
            // The resolved document update has completed PF2e preparation: rebuild from the new Statistic objects.
            await this.render();
        }, listenerOptions);
        const effects = getTabPanel("effects");
        effects?.addEventListener("dragstart", (event) => {
            const target = event.target?.closest?.("[draggable][data-item-id]");
            if (target) EffectsController.dragStart(this.actor, event, target);
        }, listenerOptions);
        effects?.addEventListener("dragover", (event) => event.preventDefault(), listenerOptions);
        effects?.addEventListener("drop", (event) => void EffectsController.drop(this.actor, event), listenerOptions);
        const biography = getTabPanel("biography");
        biography?.addEventListener("change", (event) => {
            const input = event.target;
            if (input?.matches?.("[data-biography-field]")) {
                void BiographyController.updateText(this.actor, input.dataset.biographyField, input.value);
            } else if (input?.matches?.("[data-biography-list-input]")) {
                const row = input.closest("[data-biography-list]");
                void BiographyController.updateListEntry(this.actor, row?.dataset.biographyList, Number(input.dataset.index), input.value);
            }
        }, listenerOptions);
        biography?.addEventListener("keydown", (event) => {
            const input = event.target;
            if (!input?.matches?.("[data-biography-field], [data-biography-list-input]")) return;
            if (event.key === "Enter") { event.preventDefault(); input.blur(); }
            if (event.key === "Escape") {
                event.preventDefault();
                input.value = input.matches("[data-biography-field]")
                    ? BiographyController.value(this.actor, input.dataset.biographyField)
                    : input.defaultValue;
                input.blur();
            }
        }, listenerOptions);
    }

    async #updateActorName(input) {
        const name = String(input.value ?? "").trim();
        if (!name) {
            input.value = this.actor.name;
            return ui.notifications.warn(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.NameRequired"));
        }
        if (name === this.actor.name) {
            input.value = name;
            return;
        }
        if (!this.isEditable || !this.document.canUserModify(game.user, "update")) {
            input.value = this.actor.name;
            console.warn(`${LOG_PREFIX} User may not update Actor`, { actor: this.actor.uuid, user: game.user.id });
            return ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.NotEditable"));
        }
        await this.document.update({ name });
    }

    #registerDocumentHooks() {
        const renderActor = (actor) => {
            if (actor.uuid === this.actor.uuid) void this.render();
        };
        const renderItem = (item) => {
            if (item.actor?.uuid === this.actor.uuid) void this.render();
        };
        for (const [hook, callback] of [
            ["updateActor", renderActor],
            ["createItem", renderItem],
            ["updateItem", renderItem],
            ["deleteItem", renderItem],
        ]) this.#hooks.push([hook, Hooks.on(hook, callback)]);
    }

    #hooks = [];
    #renderListeners = null;
}
