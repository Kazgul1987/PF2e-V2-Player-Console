import { LOG_PREFIX, MODULE_ID } from "../../constants.js";
import {
    GM_CONSOLE_ACTORS_SETTING, GM_CONSOLE_INITIALIZED_SETTING, GM_CONSOLE_LAYOUT_SETTING,
} from "../../settings.js";

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
            rollStatistic: GMCharacterConsole.#rollStatistic,
            rollInitiative: GMCharacterConsole.#rollInitiative,
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
        const candidates = GMCharacterConsole.discoverPlayerCharacters();
        const actors = [...selected].map((id) => game.actors.get(id)).filter((actor) => actor?.type === "character");
        return {
            actors: actors.map((actor) => this.#prepareActor(actor)),
            candidates: candidates.map((actor) => ({ id: actor.id, name: actor.name, selected: selected.has(actor.id) })),
            layout: game.settings.get(MODULE_ID, GM_CONSOLE_LAYOUT_SETTING),
        };
    }

    #prepareActor(actor) {
        const hp = actor.system.attributes.hp;
        const hero = actor.getResource?.("hero-points") ?? actor.system.resources?.heroPoints ?? { value: 0, max: 3 };
        const statistic = (slug) => actor.getStatistic?.(slug)?.mod ?? 0;
        const owners = game.users.filter((user) => !user.isGM && actor.testUserPermission(user, "OWNER")).map((user) => user.name).join(", ");
        return {
            id: actor.id, name: actor.name, img: actor.img, owners,
            level: actor.system.details.level.value,
            hp: { value: hp.value, max: hp.max, pct: hp.max > 0 ? Math.clamp((hp.value / hp.max) * 100, 0, 100) : 0 },
            ac: actor.system.attributes.ac.value,
            perception: statistic("perception"), fortitude: statistic("fortitude"), reflex: statistic("reflex"), will: statistic("will"),
            hero: { value: hero.value, max: hero.max },
            initiative: actor.initiative?.statistic?.mod ?? actor.system.attributes.initiative?.totalModifier ?? 0,
        };
    }

    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);
        this.#hookId = Hooks.on("updateActor", (actor) => void this.#refreshActor(actor));
    }

    async _onRender(context, options) {
        await super._onRender(context, options);
        this.#listeners.abort();
        this.#listeners = new AbortController();
        this.element.addEventListener("change", (event) => {
            const input = event.target.closest?.("[data-field]");
            if (input) void this.#updateField(input);
        }, { signal: this.#listeners.signal });
    }

    _tearDown(options) {
        this.#listeners.abort();
        if (this.#hookId !== undefined) Hooks.off("updateActor", this.#hookId);
        this.#hookId = undefined;
        super._tearDown(options);
    }

    #listeners = new AbortController();
    #hookId;

    #actorFor(target) {
        const id = target.closest("[data-actor-id]")?.dataset.actorId;
        const actor = game.actors.get(id ?? "");
        return actor?.type === "character" ? actor : null;
    }

    async #updateField(input) {
        const actor = this.#actorFor(input);
        if (!actor) return;
        const value = Number(input.value);
        if (!Number.isFinite(value)) return;
        if (input.dataset.field === "hp") {
            await actor.update({ "system.attributes.hp.value": Math.clamp(value, 0, actor.system.attributes.hp.max) });
        } else if (input.dataset.field === "hero") {
            const resource = actor.getResource?.("hero-points");
            await actor.updateResource("hero-points", Math.clamp(value, 0, resource?.max ?? 3));
        }
    }

    async #refreshActor(actor) {
        if (!this.rendered) return;
        const current = this.element.querySelector(`.gm-character-pane[data-actor-id="${CSS.escape(actor.id)}"]`);
        if (!current) return;
        const html = await foundry.applications.handlebars.renderTemplate(`${TEMPLATE_ROOT}/character-pane.hbs`, { actors: [this.#prepareActor(actor)], layout: "targeted" });
        const wrapper = current.ownerDocument.createElement("div");
        wrapper.innerHTML = html.trim();
        const replacement = wrapper.querySelector(".gm-character-pane");
        if (replacement) current.replaceWith(replacement);
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
