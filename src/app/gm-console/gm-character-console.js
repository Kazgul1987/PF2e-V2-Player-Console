import { LOG_PREFIX, MODULE_ID } from "../../constants.js";
import {
    GM_CONSOLE_ACTORS_SETTING, GM_CONSOLE_COLLAPSED_ACTORS_SETTING, GM_CONSOLE_INITIALIZED_SETTING,
    GM_CONSOLE_LAYOUT_SETTING,
} from "../../settings.js";
import { prepareGMInventory } from "./gm-inventory-view.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;
const TEMPLATE_ROOT = `modules/${MODULE_ID}/src/templates/gm-console`;

/** An isolated, GM-only multi-character summary over PF2e prepared Actor data. */
export class GMCharacterConsole extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: `${MODULE_ID}-gm-character-console`,
        classes: ["pf2e-v2-gm-console"],
        position: { width: 1080, height: 720 },
        window: { frame: true, positioned: true, resizable: true, minimizable: true },
        actions: {
            applySelection: GMCharacterConsole.#applySelection,
            removeActor: GMCharacterConsole.#removeActor,
            openSheet: GMCharacterConsole.#openSheet,
            toggleActor: GMCharacterConsole.#toggleActor,
            adjustFocus: GMCharacterConsole.#adjustFocus,
            rollStatistic: GMCharacterConsole.#rollStatistic,
            rollInitiative: GMCharacterConsole.#rollInitiative,
            switchView: GMCharacterConsole.#switchView,
            toggleItemSummary: GMCharacterConsole.#toggleItemSummary,
            openItem: GMCharacterConsole.#openItem,
            toggleInvested: GMCharacterConsole.#toggleInvested,
        },
        form: { closeOnSubmit: false },
    };

    static PARTS = {
        console: { template: `${TEMPLATE_ROOT}/console.hbs` },
        selector: { template: `${TEMPLATE_ROOT}/selector.hbs` },
        panes: { template: `${TEMPLATE_ROOT}/character-pane.hbs`, scrollable: [".gm-panes"] },
    };

    constructor({ openCharacterSheet, ...options } = {}) {
        super(options);
        this.openCharacterSheet = openCharacterSheet;
        this.paneViews = new Map();
    }

    get title() { return game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.GMConsole.Title"); }

    static discoverPlayerCharacters() {
        const players = game.users.filter((user) => !user.isGM);
        return game.actors.filter((actor) => actor.type === "character" && players.some((user) => actor.testUserPermission(user, "OWNER")));
    }

    async initializeSelection() {
        if (!game.user?.isGM) throw new Error(`${LOG_PREFIX} GM Console is restricted to GMs`);
        if (game.settings.get(MODULE_ID, GM_CONSOLE_INITIALIZED_SETTING)) return;
        await game.settings.set(MODULE_ID, GM_CONSOLE_ACTORS_SETTING, GMCharacterConsole.discoverPlayerCharacters().map((actor) => actor.id));
        await game.settings.set(MODULE_ID, GM_CONSOLE_INITIALIZED_SETTING, true);
    }

    async _prepareContext() {
        if (!game.user?.isGM) throw new Error(`${LOG_PREFIX} GM Console is restricted to GMs`);
        const selected = new Set(game.settings.get(MODULE_ID, GM_CONSOLE_ACTORS_SETTING));
        const storedCollapsed = game.settings.get(MODULE_ID, GM_CONSOLE_COLLAPSED_ACTORS_SETTING);
        const collapsed = new Set(storedCollapsed.filter((id) => game.actors.get(id)?.type === "character"));
        if (collapsed.size !== storedCollapsed.length) {
            await game.settings.set(MODULE_ID, GM_CONSOLE_COLLAPSED_ACTORS_SETTING, [...collapsed]);
        }
        const candidates = GMCharacterConsole.discoverPlayerCharacters();
        const actors = [...selected].map((id) => game.actors.get(id)).filter((actor) => actor?.type === "character");
        return {
            actors: actors.map((actor) => this.#prepareActor(actor, collapsed.has(actor.id))),
            candidates: candidates.map((actor) => ({ id: actor.id, name: actor.name, selected: selected.has(actor.id) })),
            layout: game.settings.get(MODULE_ID, GM_CONSOLE_LAYOUT_SETTING),
        };
    }

    #prepareActor(actor, collapsed = false) {
        const hp = actor.system.attributes.hp;
        const hero = actor.getResource?.("hero-points") ?? actor.system.resources?.heroPoints ?? { value: 0, max: 3 };
        const focusResource = actor.getResource?.("focus");
        const focus = focusResource?.max > 0 ? {
            value: focusResource.value,
            max: focusResource.max,
            pips: Array.from({ length: focusResource.max }, (_, index) => ({ filled: index < focusResource.value })),
        } : null;
        const conditions = (actor.conditions?.active ?? []).map((condition) => ({
            id: condition.id,
            name: condition.name,
        }));
        const statistic = (slug) => actor.getStatistic?.(slug)?.mod ?? 0;
        const owners = game.users.filter((user) => !user.isGM && actor.testUserPermission(user, "OWNER")).map((user) => user.name).join(", ");
        const activeView = this.paneViews.get(actor.id) ?? "overview";
        return {
            id: actor.id, name: actor.name, img: actor.img, owners, collapsed,
            isOverview: activeView === "overview",
            isInventory: activeView === "inventory",
            inventory: activeView === "inventory" && !collapsed ? prepareGMInventory(actor) : null,
            level: actor.system.details.level.value,
            hp: { value: hp.value, max: hp.max, pct: hp.max > 0 ? Math.clamp((hp.value / hp.max) * 100, 0, 100) : 0 },
            ac: actor.system.attributes.ac.value,
            perception: statistic("perception"), fortitude: statistic("fortitude"), reflex: statistic("reflex"), will: statistic("will"),
            hero: { value: hero.value, max: hero.max },
            focus,
            conditions,
            initiative: actor.initiative?.statistic?.mod ?? actor.system.attributes.initiative?.totalModifier ?? 0,
        };
    }

    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);
        this.#hookIds = [
            ["updateActor", Hooks.on("updateActor", (actor) => void this.#refreshActor(actor))],
            ...["createItem", "updateItem", "deleteItem"].map((hook) => [
                hook,
                Hooks.on(hook, (item) => {
                    if (item.parent?.type === "character") void this.#refreshActor(item.parent);
                }),
            ]),
        ];
    }

    async _onRender(context, options) {
        await super._onRender(context, options);
        this.#listeners.abort();
        this.#listeners = new AbortController();
        this.element.addEventListener("change", (event) => {
            const input = event.target.closest?.("[data-field]");
            if (input) void this.#updateField(input);
            const inventoryInput = event.target.closest?.("[data-inventory-field]");
            if (inventoryInput) void this.#updateInventoryField(inventoryInput);
        }, { signal: this.#listeners.signal });
        this.element.addEventListener("contextmenu", (event) => {
            const control = event.target.closest?.('[data-action="adjustFocus"]');
            if (!control) return;
            event.preventDefault();
            void this.#changeFocus(control, -1);
        }, { signal: this.#listeners.signal });
    }

    _tearDown(options) {
        this.#listeners.abort();
        for (const [hook, id] of this.#hookIds) Hooks.off(hook, id);
        this.#hookIds = [];
        super._tearDown(options);
    }

    #listeners = new AbortController();
    #hookIds = [];

    #actorFor(target) {
        const id = target.closest("[data-actor-id]")?.dataset.actorId;
        const actor = game.actors.get(id ?? "");
        return actor?.type === "character" ? actor : null;
    }

    #itemFor(target) {
        const actor = this.#actorFor(target);
        const itemId = target.closest("[data-item-id]")?.dataset.itemId;
        return actor?.inventory?.get(itemId ?? "") ?? null;
    }

    async #updateField(input) {
        const actor = this.#actorFor(input);
        if (!actor) return;
        const value = Number(input.value);
        if (!Number.isFinite(value)) return;
        if (input.dataset.field === "hp") {
            await actor.update({ "system.attributes.hp.value": value });
        } else if (input.dataset.field === "hero") {
            const resource = actor.getResource?.("hero-points");
            if (!resource) return;
            await actor.updateResource("hero-points", value);
        }
    }

    async #refreshActor(actor) {
        if (!this.rendered) return;
        const current = this.element.querySelector(`.gm-character-pane[data-actor-id="${CSS.escape(actor.id)}"]`);
        if (!current) return;
        const collapsed = game.settings.get(MODULE_ID, GM_CONSOLE_COLLAPSED_ACTORS_SETTING).includes(actor.id);
        const html = await foundry.applications.handlebars.renderTemplate(`${TEMPLATE_ROOT}/character-pane.hbs`, { actors: [this.#prepareActor(actor, collapsed)], layout: "targeted" });
        const wrapper = current.ownerDocument.createElement("div");
        wrapper.innerHTML = html.trim();
        const replacement = wrapper.querySelector(".gm-character-pane");
        if (replacement) current.replaceWith(replacement);
    }

    async #updateInventoryField(input) {
        const actor = this.#actorFor(input);
        const item = this.#itemFor(input);
        if (!actor?.isOwner || !item) return;
        if (input.dataset.inventoryField === "quantity") {
            const quantity = Number(input.value);
            if (Number.isFinite(quantity)) await item.update({ "system.quantity": quantity });
        } else if (input.dataset.inventoryField === "carry") {
            await actor.changeCarryType(item, { carryType: input.value, handsHeld: input.value === "held" ? 1 : 0 });
        }
    }

    static async #applySelection(_event, target) {
        const root = target.closest("form") ?? this.element;
        const ids = [...root.querySelectorAll('input[name="gm-console-actor"]:checked')].map((input) => input.value);
        const layout = root.querySelector('[name="gm-console-layout"]')?.value ?? "columns";
        await game.settings.set(MODULE_ID, GM_CONSOLE_ACTORS_SETTING, ids);
        await game.settings.set(MODULE_ID, GM_CONSOLE_LAYOUT_SETTING, layout);
        await this.render();
    }

    static async #removeActor(_event, target) {
        const actor = this.#actorFor(target);
        if (!actor) return;
        const ids = game.settings.get(MODULE_ID, GM_CONSOLE_ACTORS_SETTING).filter((id) => id !== actor.id);
        await game.settings.set(MODULE_ID, GM_CONSOLE_ACTORS_SETTING, ids);
        await this.render();
    }

    static async #toggleActor(_event, target) {
        const actor = this.#actorFor(target);
        if (!actor) return;
        const collapsed = new Set(game.settings.get(MODULE_ID, GM_CONSOLE_COLLAPSED_ACTORS_SETTING));
        if (collapsed.has(actor.id)) collapsed.delete(actor.id);
        else collapsed.add(actor.id);
        await game.settings.set(MODULE_ID, GM_CONSOLE_COLLAPSED_ACTORS_SETTING, [...collapsed]);
        await this.#refreshActor(actor);
    }

    static async #switchView(_event, target) {
        const actor = this.#actorFor(target);
        const view = target.dataset.view;
        if (!actor || !["overview", "inventory"].includes(view)) return;
        this.paneViews.set(actor.id, view);
        await this.#refreshActor(actor);
    }

    static async #toggleItemSummary(_event, target) {
        const item = this.#itemFor(target);
        const row = target.closest("[data-item-id]");
        const summary = row?.querySelector(".gm-item-summary");
        if (!item || !summary) return;
        if (!summary.hidden) {
            summary.hidden = true;
            return;
        }
        const description = await item.getDescription({ secrets: item.isOwner });
        summary.innerHTML = description.value;
        summary.hidden = false;
    }

    static #openItem(_event, target) {
        this.#itemFor(target)?.sheet.render(true);
    }

    static async #toggleInvested(_event, target) {
        const actor = this.#actorFor(target);
        const item = this.#itemFor(target);
        if (actor?.isOwner && item?.isInvested !== null) await actor.toggleInvested(item.id);
    }

    static async #adjustFocus(_event, target) {
        await this.#changeFocus(target, 1);
    }

    async #changeFocus(target, delta) {
        const actor = this.#actorFor(target);
        const resource = actor?.getResource?.("focus");
        if (!actor || !resource || resource.max <= 0) return;
        await actor.updateResource("focus", resource.value + delta);
    }

    static #openSheet(_event, target) {
        const actor = this.#actorFor(target);
        if (actor) this.openCharacterSheet?.(actor);
    }

    static async #rollStatistic(_event, target) {
        const actor = this.#actorFor(target);
        await actor?.getStatistic?.(target.dataset.statistic)?.roll();
    }

    static async #rollInitiative(_event, target) {
        const actor = this.#actorFor(target);
        await actor?.initiative?.roll();
    }
}
