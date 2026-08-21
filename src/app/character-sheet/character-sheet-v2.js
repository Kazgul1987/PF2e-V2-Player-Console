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
import { PFSAdapter } from "../../pf2e/pfs-adapter.js";
import { PFSController } from "../../controllers/pfs-controller.js";
import { getPresentationSettings } from "../../settings.js";
import { SidebarController } from "../../controllers/sidebar-controller.js";
import { prepareCharacterView } from "../character-view/character-view-context.js";
import { BiographyEditor, bindCharacterPaneListeners } from "../character-view/character-interactions.js";

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
            rollInitiative: PF2eCharacterSheetV2.#rollInitiative,
            editAttributeBoosts: PF2eCharacterSheetV2.#openCoreCharacterSheet,
            editLanguages: PF2eCharacterSheetV2.#openCoreCharacterSheet,
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
            prepareSpell: PF2eCharacterSheetV2.#spellAction,
            unprepareSpell: PF2eCharacterSheetV2.#spellAction,
            toggleSlotExpended: PF2eCharacterSheetV2.#spellAction,
            spellAttack: PF2eCharacterSheetV2.#spellAction,
            openSpellPreparation: PF2eCharacterSheetV2.#spellAction,
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
            editBiographyRichText: PF2eCharacterSheetV2.#biographyAction,
            saveBiographyRichText: PF2eCharacterSheetV2.#biographyAction,
            cancelBiographyRichText: PF2eCharacterSheetV2.#biographyAction,
            openPFSBoon: PF2eCharacterSheetV2.#pfsAction,
            pfsBoonToChat: PF2eCharacterSheetV2.#pfsAction,
            pfsBoonSummary: PF2eCharacterSheetV2.#pfsAction,
            deletePFSBoon: PF2eCharacterSheetV2.#pfsAction,
            browsePFSBoons: PF2eCharacterSheetV2.#pfsAction,
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
        sidebar: { template: `modules/${MODULE_ID}/src/templates/character-sheet/sidebar.hbs` },
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
        const presentation = getPresentationSettings();
        const view = await prepareCharacterView(this.actor, { activeTab: this.tabGroups.primary, editable: this.isEditable });
        return {
            ...(await super._prepareContext(options)),
            ...view,
            tabs: this._prepareTabs("primary"),
            ...presentation,
        };
    }

    #applyPresentationSettings() {
        const { theme, density, ornamentation, showSidebar } = getPresentationSettings();
        const element = this.element;
        if (!element) return;
        element.dataset.theme = theme;
        element.dataset.density = density;
        element.dataset.ornamentation = ornamentation;
        element.dataset.sidebar = String(showSidebar);
    }

    /** Refresh client presentation without querying either the main or detached document. */
    applyPresentationSettings() {
        this.#applyPresentationSettings();
    }

    async _preparePartContext(partId, context, options) {
        const partContext = await super._preparePartContext(partId, context, options);
        if (TABS.includes(partId)) Object.assign(partContext, await prepareCharacterView(this.actor, {
            activeTab: partId,
            editable: this.isEditable,
        }));
        if (TABS.includes(partId)) {
            partContext.tab = context.tabs[partId];
        }
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
        BiographyEditor.close({ owner: this });
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

    static async #rollInitiative(event) {
        return this.actor.initiative?.roll?.(RollController.eventToRollParams(event));
    }

    static #openCoreCharacterSheet() {
        ui.notifications.info(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Character.CoreEditorNotice"));
        return this.actor.sheet?.render(true, { tab: "character" });
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
            case "prepareSpell": return SpellcastingController.prepare(this.actor, data);
            case "unprepareSpell": return SpellcastingController.unprepare(this.actor, data);
            case "toggleSlotExpended": return SpellcastingController.expend(this.actor, data);
            case "spellAttack": return SpellcastingController.attack(this.actor, data.entryId, event);
            case "openSpellPreparation": return SpellcastingController.openPreparationManager(this.actor, data.entryId);
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
            case "editBiographyRichText": return this.#openBiographyEditor(target);
            case "saveBiographyRichText": return this.#saveBiographyEditor(target);
            case "cancelBiographyRichText": return this.#closeBiographyEditor();
        }
    }

    static async #pfsAction(event, target) {
        const row = target.closest("[data-item-id]");
        const id = row?.dataset.itemId;
        switch (target.dataset.action) {
            case "openPFSBoon": return PFSController.open(this.actor, id);
            case "pfsBoonToChat": return PFSController.toChat(this.actor, id, event);
            case "deletePFSBoon": return PFSController.remove(this.actor, id, event);
            case "browsePFSBoons": return PFSController.browse(this.actor);
            case "pfsBoonSummary": {
                const summary = row?.querySelector(":scope > .item-summary");
                if (!summary) return;
                if (!summary.hidden) { summary.hidden = true; summary.replaceChildren(); return; }
                summary.innerHTML = await PFSController.summary(this.actor, id);
                summary.hidden = false;
            }
        }
    }

    async #openBiographyEditor(target) {
        return BiographyEditor.open({ actor: this.actor, root: this.element, owner: this, target, editable: this.isEditable });
    }

    async #saveBiographyEditor(target) { return BiographyEditor.save({ owner: this, actorId: this.actor.id, target }); }
    #closeBiographyEditor() { BiographyEditor.close({ owner: this, actorId: this.actor.id }); }

    async _onRender(context, options) {
        // An explicit Application render disconnects the V14 form element, whose callback destroys ProseMirror.
        // Document hooks are deferred while editing, but other render callers still get a clean cancellation.
        if (BiographyEditor.isEditing(this, this.actor.id) && !this.element?.isConnected) BiographyEditor.close({ owner: this, actorId: this.actor.id });
        await super._onRender(context, options);
        this.#applyPresentationSettings();
        this.#renderListeners?.abort();
        this.#renderListeners = new AbortController();
        bindCharacterPaneListeners({ actor: this.actor, root: this.element, rerender: () => this.render(), signal: this.#renderListeners.signal });
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
            if (actor.uuid === this.actor.uuid && !BiographyEditor.isEditing(this)) void this.render();
        };
        const renderItem = (item) => {
            if (item.actor?.uuid === this.actor.uuid && !BiographyEditor.isEditing(this)) void this.render();
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

/** Shared ApplicationV2 action semantics consumed by actor-explicit GM panes. */
export const CHARACTER_ACTIONS = PF2eCharacterSheetV2.DEFAULT_OPTIONS.actions;
