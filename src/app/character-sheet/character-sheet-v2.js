import { LOG_PREFIX, MODULE_ID, TABS } from "../../constants.js";
import { CharacterAdapter } from "../../pf2e/character-adapter.js";
import { RollController } from "../../controllers/roll-controller.js";

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
            contentTag: "form",
        },
        position: { width: 920, height: 760 },
        form: {
            handler: PF2eCharacterSheetV2.#submitActor,
            submitOnChange: false,
            closeOnSubmit: false,
        },
        actions: {
            detach: PF2eCharacterSheetV2.#detach,
            rollStatistic: PF2eCharacterSheetV2.#rollStatistic,
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
        if (TABS.includes(partId)) partContext.tab = context.tabs[partId];
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

    static async #submitActor(_event, _form, formData) {
        if (!this.isEditable || !this.document.canUserModify(game.user, "update")) {
            console.warn(`${LOG_PREFIX} User may not update Actor`, { actor: this.actor.uuid, user: game.user.id });
            return ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.NotEditable"));
        }

        const name = String(formData.object.name ?? "").trim();
        if (!name) return ui.notifications.warn(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.NameRequired"));
        if (name !== this.document.name) await this.document.update({ name });
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
}
