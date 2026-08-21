import { CHARACTER_ACTIONS } from "../character-sheet/character-sheet-v2.js";
import { CHARACTER_TEMPLATE, prepareCharacterView } from "../character-view/character-view-context.js";
import { LOG_PREFIX, MODULE_ID, TABS } from "../../constants.js";
import { CharacterAdapter } from "../../pf2e/character-adapter.js";
import { getPresentationSettings } from "../../settings.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

function gmOnly() {
    if (game.user?.isGM) return true;
    ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.GMOnly"));
    return false;
}

export class GMCharacterConsole extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: `${MODULE_ID}-gm-console`,
        classes: [MODULE_ID, "pf2e-v2-character-sheet", "gm-character-console"],
        window: { frame: true, positioned: true, resizable: true, minimizable: true },
        position: { width: 1400, height: 850 },
        actions: {
            ...Object.fromEntries(Object.entries(CHARACTER_ACTIONS).map(([name, action]) => [name, async function (event, target) {
                const actor = this.actorForTarget(target);
                if (!actor) return;
                this.#actionActor = actor;
                try { return await action.call(this, event, target); }
                finally { this.#actionActor = null; }
            }])),
            // Pane-local tab state is handled after render rather than by a global tab group.
            tab: () => undefined,
            removePane: GMCharacterConsole.#removePane,
            setLayout: GMCharacterConsole.#setLayout,
        },
    };

    static PARTS = { console: { template: `modules/${MODULE_ID}/src/templates/gm-character-console/console.hbs` } };

    #actorIds = [];
    #tabs = new Map();
    #layout = "grid";
    #hooks = [];
    #actionActor = null;

    constructor({ actors = [], ...options } = {}) {
        if (!game.user?.isGM) throw new Error(`${LOG_PREFIX} GM Character Console is GM-only`);
        super(options);
        this.#actorIds = [...new Set(actors.filter(CharacterAdapter.supports).map((actor) => actor.id))];
    }

    get title() { return game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Console.Title"); }
    get actor() { return this.#actionActor; }
    get isEditable() { return Boolean(this.#actionActor?.canUserModify(game.user, "update")); }

    actorForTarget(target) {
        const id = target?.closest?.("[data-actor-id]")?.dataset.actorId;
        return game.actors.get(id ?? "");
    }

    addActor(actor, { render = true } = {}) {
        if (!gmOnly() || !CharacterAdapter.supports(actor)) return false;
        if (!this.#actorIds.includes(actor.id)) this.#actorIds.push(actor.id);
        if (render) void this.render(true);
        return true;
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        const panes = [];
        for (const actorId of this.#actorIds) {
            const actor = game.actors.get(actorId);
            if (!CharacterAdapter.supports(actor)) continue;
            const activeTab = this.#tabs.get(actorId) ?? "character";
            const view = await prepareCharacterView(actor, {
                activeTab,
                editable: actor.canUserModify(game.user, "update"),
            });
            panes.push({ actorId, paneId: `character-${actorId}`, template: CHARACTER_TEMPLATE[activeTab], view });
        }
        return { ...context, panes, layout: this.#layout, empty: panes.length === 0, ...getPresentationSettings() };
    }

    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);
        const refresh = (document) => {
            const actor = document.actor ?? document;
            if (this.#actorIds.includes(actor?.id)) void this.render();
        };
        for (const hook of ["updateActor", "createItem", "updateItem", "deleteItem"]) {
            this.#hooks.push([hook, Hooks.on(hook, refresh)]);
        }
    }

    async _onRender(context, options) {
        if (!game.user?.isGM) return this.close();
        await super._onRender(context, options);
        const presentation = getPresentationSettings();
        Object.assign(this.element.dataset, {
            theme: presentation.theme,
            density: presentation.density,
            ornamentation: presentation.ornamentation,
            sidebar: String(presentation.showSidebar),
            layout: this.#layout,
        });
        this.element.querySelectorAll(".gm-character-pane [data-action='tab']").forEach((button) => {
            button.addEventListener("click", () => {
                const pane = button.closest("[data-actor-id]");
                if (!pane || !TABS.includes(button.dataset.tab)) return;
                this.#tabs.set(pane.dataset.actorId, button.dataset.tab);
                void this.render();
            });
        });
    }

    async _onClose(options) {
        for (const [hook, id] of this.#hooks) Hooks.off(hook, id);
        this.#hooks.length = 0;
        await super._onClose(options);
    }

    applyPresentationSettings() { if (this.rendered) void this.render(); }

    static #removePane(_event, target) {
        const id = target.closest("[data-actor-id]")?.dataset.actorId;
        this.#actorIds = this.#actorIds.filter((actorId) => actorId !== id);
        this.#tabs.delete(id);
        return this.render();
    }

    static #setLayout(_event, target) {
        if (!["grid", "columns", "rows"].includes(target.dataset.layout)) return;
        this.#layout = target.dataset.layout;
        return this.render();
    }
}

export function canOpenGMConsole() { return gmOnly(); }
