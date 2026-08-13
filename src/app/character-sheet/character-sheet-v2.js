import { LOG_PREFIX, MODULE_ID, TABS } from "../../constants.js";
import { CharacterAdapter } from "../../pf2e/character-adapter.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

export class PF2eCharacterSheetV2 extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: `${MODULE_ID}-{id}`,
        classes: [MODULE_ID, "pf2e-v2-character-sheet"],
        tag: "section",
        window: { frame: true, positioned: true, resizable: true, minimizable: true },
        position: { width: 920, height: 760 },
        actions: {
            tab: PF2eCharacterSheetV2.#changeTab,
            detach: PF2eCharacterSheetV2.#detach,
        },
    };

    static PARTS = {
        header: { template: `modules/${MODULE_ID}/src/templates/character-sheet/header.hbs` },
        navigation: { template: `modules/${MODULE_ID}/src/templates/character-sheet/navigation.hbs` },
        character: { template: `modules/${MODULE_ID}/src/templates/character-sheet/character.hbs`, scrollable: [""] },
        placeholder: { template: `modules/${MODULE_ID}/src/templates/character-sheet/placeholder.hbs`, scrollable: [""] },
    };

    tabGroups = { primary: "character" };

    constructor(actor, options = {}) {
        if (!CharacterAdapter.supports(actor)) throw new Error(`${LOG_PREFIX} Cannot open a non-character Actor`);
        super({ ...options, id: actor.id });
        this.actor = actor;
    }

    get title() {
        return `${this.actor.name} — V2 Character Sheet`;
    }

    async _prepareContext(options) {
        return {
            ...(await super._prepareContext(options)),
            actor: CharacterAdapter.prepare(this.actor),
            tabs: TABS.map((id) => ({ id, label: id[0].toUpperCase() + id.slice(1), active: this.tabGroups.primary === id })),
            activeTab: this.tabGroups.primary,
        };
    }

    async _preparePartContext(partId, context, options) {
        const partContext = await super._preparePartContext(partId, context, options);
        partContext.isCharacterPart = partId === "character" && context.activeTab === "character";
        partContext.isPlaceholderPart = partId === "placeholder" && context.activeTab !== "character";
        return partContext;
    }

    _headerControlButtons() {
        const controls = super._headerControlButtons();
        return (function* (app) {
            yield { icon: "fa-solid fa-up-right-from-square", label: "Detach to Browser Window", action: "detach", visible: true };
            yield* controls;
        })(this);
    }

    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);
        this.#hooks.push(["updateActor", Hooks.on("updateActor", (actor) => {
            if (actor.uuid === this.actor.uuid) void this.render({ parts: ["header", "character"] });
        })]);
        this.#hooks.push(["updateItem", Hooks.on("updateItem", (item) => {
            if (item.actor?.uuid === this.actor.uuid) void this.render({ parts: ["header", "character"] });
        })]);
    }

    async _onClose(options) {
        for (const [hook, id] of this.#hooks) Hooks.off(hook, id);
        this.#hooks.length = 0;
        await super._onClose(options);
    }

    static #changeTab(event, target) {
        const tab = target.dataset.tab;
        if (!TABS.includes(tab)) return;
        this.tabGroups.primary = tab;
        void this.render({ parts: ["navigation", "character", "placeholder"] });
    }

    static #detach() {
        if (typeof this.detachWindow === "function") return this.detachWindow();
        console.warn(`${LOG_PREFIX} detachWindow is not available in this Foundry distribution`, { application: this });
        ui.notifications.warn("PF2e V2 Player Console: This Foundry distribution does not expose detached Application windows.");
    }

    #hooks = [];
}
