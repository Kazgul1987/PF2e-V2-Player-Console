import { CHARACTER_ACTIONS } from "../character-sheet/character-sheet-v2.js";
import { CharacterActionDispatcher, BiographyEditor, bindCharacterPaneListeners } from "../character-view/character-interactions.js";
import { CHARACTER_TEMPLATE, prepareCharacterView } from "../character-view/character-view-context.js";
import { LOG_PREFIX, MODULE_ID, TABS } from "../../constants.js";
import { CharacterAdapter } from "../../pf2e/character-adapter.js";
import { GM_ACTORS_SETTING, GM_FOCUSED_SETTING, GM_LAYOUT_SETTING, getPresentationSettings } from "../../settings.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const PANE_TEMPLATE = `modules/${MODULE_ID}/src/templates/gm-character-console/pane.hbs`;

function gmOnly({ notify = true } = {}) {
    if (game.user?.isGM) return true;
    if (notify) ui.notifications.error(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.GMOnly"));
    return false;
}

function playerOwnedCharacters() {
    const owner = CONST.DOCUMENT_OWNERSHIP_LEVELS.OWNER;
    const players = game.users.filter((user) => !user.isGM);
    return game.actors.filter((actor) => CharacterAdapter.supports(actor)
        && players.some((user) => Number(actor.ownership?.[user.id] ?? actor.ownership?.default ?? 0) >= owner));
}

export class GMCharacterConsole extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: `${MODULE_ID}-gm-console`,
        classes: [MODULE_ID, "pf2e-v2-character-sheet", "pf2e-v2-gm-console", "gm-character-console"],
        window: { frame: true, positioned: true, resizable: true, minimizable: true },
        position: { width: 1400, height: 850 },
        actions: {
            ...Object.fromEntries(Object.keys(CHARACTER_ACTIONS).map((name) => [name, function (event, target) {
                const paneRoot = target.closest?.("[data-actor-id]");
                const actor = game.actors.get(paneRoot?.dataset.actorId ?? "");
                return CharacterActionDispatcher.run({ actor, action: name, event, target, app: this, paneRoot, actions: CHARACTER_ACTIONS });
            }])),
            tab: () => undefined,
            removePane: GMCharacterConsole.#removePane,
            setLayout: GMCharacterConsole.#setLayout,
            focusPane: GMCharacterConsole.#focusPane,
            selectFocused: GMCharacterConsole.#selectFocused,
            openSheet: GMCharacterConsole.#openSheet,
        },
    };

    static PARTS = { console: { template: `modules/${MODULE_ID}/src/templates/gm-character-console/console.hbs` } };
    #actorIds = [];
    #tabs = new Map();
    #layout = "columns";
    #focusedActorId = null;
    #hooks = [];
    #paneListeners = new Map();
    #pendingRefresh = new Map();

    constructor({ actors = [], ...options } = {}) {
        if (!gmOnly()) throw new Error(`${LOG_PREFIX} GM Character Console is GM-only`);
        super(options);
        const saved = game.settings.get(MODULE_ID, GM_ACTORS_SETTING);
        const discovered = playerOwnedCharacters().map((actor) => actor.id);
        const requested = actors.filter(CharacterAdapter.supports).map((actor) => actor.id);
        this.#actorIds = this.#validIds([...new Set([...(saved.length ? saved : discovered), ...requested])]);
        this.#layout = game.settings.get(MODULE_ID, GM_LAYOUT_SETTING);
        this.#focusedActorId = game.settings.get(MODULE_ID, GM_FOCUSED_SETTING) || this.#actorIds[0] || null;
        void this.#persistActors();
    }

    get title() { return game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Console.Title"); }
    #validIds(ids) { return ids.filter((id) => CharacterAdapter.supports(game.actors.get(id))); }

    addActor(actor, { render = true } = {}) {
        if (!gmOnly() || !CharacterAdapter.supports(actor)) return false;
        if (!this.#actorIds.includes(actor.id)) this.#actorIds.push(actor.id);
        this.#focusedActorId ??= actor.id;
        void this.#persistActors();
        if (render) void this.render(true);
        return true;
    }

    async #paneContext(actorId) {
        const actor = game.actors.get(actorId);
        if (!CharacterAdapter.supports(actor)) return null;
        const activeTab = this.#tabs.get(actorId) ?? "character";
        const view = await prepareCharacterView(actor, { activeTab, editable: actor.canUserModify(game.user, "update") });
        return { actorId, paneId: `character-${actorId}`, template: CHARACTER_TEMPLATE[activeTab], view };
    }

    async _prepareContext(options) {
        const context = await super._prepareContext(options);
        this.#actorIds = this.#validIds(this.#actorIds);
        if (!this.#actorIds.includes(this.#focusedActorId)) this.#focusedActorId = this.#actorIds[0] ?? null;
        const renderedIds = this.#layout === "focused" ? this.#actorIds.filter((id) => id === this.#focusedActorId) : this.#actorIds;
        const panes = (await Promise.all(renderedIds.map((id) => this.#paneContext(id)))).filter(Boolean);
        const ownedIds = new Set(playerOwnedCharacters().map((actor) => actor.id));
        const candidates = game.actors.filter(CharacterAdapter.supports)
            .sort((a, b) => Number(ownedIds.has(b.id)) - Number(ownedIds.has(a.id)) || a.name.localeCompare(b.name))
            .map((actor) => ({ id: actor.id, name: actor.name, selected: this.#actorIds.includes(actor.id) }));
        const selectedActors = this.#actorIds.map((id) => game.actors.get(id)).filter(Boolean).map((actor) => ({ id: actor.id, name: actor.name, focused: actor.id === this.#focusedActorId }));
        return { ...context, panes, candidates, selectedActors, layout: this.#layout, empty: panes.length === 0, ...getPresentationSettings() };
    }

    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);
        const refreshActor = (actor) => { if (this.#actorIds.includes(actor?.id)) this.refreshPane(actor.id); };
        const refreshItem = (item) => refreshActor(item.actor ?? item.parent);
        for (const [hook, callback] of [["updateActor", refreshActor], ["createItem", refreshItem], ["updateItem", refreshItem], ["deleteItem", refreshItem]]) {
            this.#hooks.push([hook, Hooks.on(hook, callback)]);
        }
    }

    async _onRender(context, options) {
        if (!gmOnly({ notify: false })) return this.close();
        await super._onRender(context, options);
        const presentation = getPresentationSettings();
        Object.assign(this.element.dataset, { theme: presentation.theme, density: presentation.density, ornamentation: presentation.ornamentation, sidebar: String(presentation.showSidebar), layout: this.#layout });
        for (const pane of this.element.querySelectorAll(".gm-character-pane")) this.#bindPane(pane);
        this.element.querySelector("[data-character-selection]")?.addEventListener("submit", (event) => void this.#applySelection(event));
    }

    #bindPane(pane) {
        const actorId = pane.dataset.actorId;
        const actor = game.actors.get(actorId);
        this.#paneListeners.get(actorId)?.abort();
        const controller = new AbortController();
        this.#paneListeners.set(actorId, controller);
        bindCharacterPaneListeners({ actor, root: pane, rerender: () => this.refreshPane(actorId), signal: controller.signal });
        pane.querySelectorAll("[data-action='tab']").forEach((button) => button.addEventListener("click", () => {
            if (!TABS.includes(button.dataset.tab)) return;
            this.#tabs.set(actorId, button.dataset.tab);
            this.refreshPane(actorId);
        }, { signal: controller.signal }));
    }

    refreshPane(actorId) {
        if (this.#layout === "focused" && actorId !== this.#focusedActorId) return Promise.resolve();
        if (this.#pendingRefresh.has(actorId)) return this.#pendingRefresh.get(actorId);
        const pending = Promise.resolve().then(async () => {
            const current = this.element?.querySelector(`.gm-character-pane[data-actor-id="${CSS.escape(actorId)}"]`);
            const pane = await this.#paneContext(actorId);
            if (!current || !pane) return;
            BiographyEditor.close(this);
            const html = await foundry.applications.handlebars.renderTemplate(PANE_TEMPLATE, pane);
            const template = current.ownerDocument.createElement("template");
            template.innerHTML = html.trim();
            const replacement = template.content.firstElementChild;
            current.replaceWith(replacement);
            this.#bindPane(replacement);
        }).finally(() => this.#pendingRefresh.delete(actorId));
        this.#pendingRefresh.set(actorId, pending);
        return pending;
    }

    async #persistActors() { await game.settings.set(MODULE_ID, GM_ACTORS_SETTING, this.#validIds(this.#actorIds)); }
    async #applySelection(event) {
        event.preventDefault();
        const data = new FormData(event.currentTarget);
        this.#actorIds = this.#validIds(data.getAll("actor"));
        await this.#persistActors();
        await this.render(true);
    }

    async _onClose(options) {
        BiographyEditor.close(this);
        for (const controller of this.#paneListeners.values()) controller.abort();
        for (const [hook, id] of this.#hooks) Hooks.off(hook, id);
        this.#hooks.length = 0;
        await super._onClose(options);
    }

    applyPresentationSettings() { if (this.rendered) void this.render(); }

    static async #removePane(_event, target) {
        const id = target.closest("[data-actor-id]")?.dataset.actorId;
        this.#actorIds = this.#actorIds.filter((actorId) => actorId !== id);
        this.#tabs.delete(id);
        await this.#persistActors();
        return this.render(true);
    }
    static async #setLayout(_event, target) {
        if (!["grid", "columns", "focused"].includes(target.dataset.layout)) return;
        this.#layout = target.dataset.layout;
        if (!this.#actorIds.includes(this.#focusedActorId)) this.#focusedActorId = this.#actorIds[0] ?? null;
        await game.settings.set(MODULE_ID, GM_LAYOUT_SETTING, this.#layout);
        return this.render(true);
    }
    static async #focusPane(_event, target) {
        this.#focusedActorId = target.closest("[data-actor-id]")?.dataset.actorId;
        await game.settings.set(MODULE_ID, GM_FOCUSED_SETTING, this.#focusedActorId ?? "");
        this.#layout = "focused";
        await game.settings.set(MODULE_ID, GM_LAYOUT_SETTING, "focused");
        return this.render(true);
    }
    static async #selectFocused(_event, target) {
        if (!this.#actorIds.includes(target.dataset.actorId)) return;
        this.#focusedActorId = target.dataset.actorId;
        await game.settings.set(MODULE_ID, GM_FOCUSED_SETTING, this.#focusedActorId);
        return this.render(true);
    }
    static #openSheet(_event, target) {
        const actor = game.actors.get(target.closest("[data-actor-id]")?.dataset.actorId ?? "");
        return game.modules.get(MODULE_ID)?.api?.openCharacterSheet(actor);
    }
}

export function canOpenGMConsole() { return gmOnly(); }
