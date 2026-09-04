import { LOG_PREFIX, MODULE_ID } from "../../constants.js";
import { ActionController } from "../../controllers/action-controller.js";
import {
    GM_CONSOLE_ACTORS_SETTING, GM_CONSOLE_COLLAPSED_ACTORS_SETTING, GM_CONSOLE_INITIALIZED_SETTING,
    GM_CONSOLE_LAYOUT_SETTING,
} from "../../settings.js";
import { prepareGMInventory } from "./gm-inventory-view.js";
import { prepareGMSpellcasting } from "./gm-spellcasting-view.js";
import { prepareGMCombat } from "./gm-combat-view.js";
import { QuickRollController } from "./quick-rolls/quick-roll-controller.js";

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
            toggleSpellSummary: GMCharacterConsole.#toggleSpellSummary,
            openSpell: GMCharacterConsole.#openSpell,
            castSpell: GMCharacterConsole.#castSpell,
            selectDamageType: GMCharacterConsole.#selectDamageType,
            quickCheck: GMCharacterConsole.#quickCheck,
            submitQuickRoll: GMCharacterConsole.#submitQuickRoll,
            targetPlayerToken: GMCharacterConsole.#targetPlayerToken,
            targetAllPlayerTokens: GMCharacterConsole.#targetAllPlayerTokens,
            switchCombatView: GMCharacterConsole.#switchCombatView,
            openCombatantSheet: GMCharacterConsole.#openCombatantSheet,
            rollCombatStatistic: GMCharacterConsole.#rollCombatStatistic,
            rollCombatStrike: GMCharacterConsole.#rollCombatStrike,
            useCombatAction: GMCharacterConsole.#useCombatAction,
        },
        form: { closeOnSubmit: false },
    };

    static TABS = {
        "gm-console-primary": {
            initial: "characters",
            tabs: ["characters", "quick-rolls", "combat"].map((id) => ({ id })),
            labelPrefix: "PF2E_V2_PLAYER_CONSOLE.GMConsole.Tabs",
        },
    };

    static PARTS = {
        console: { template: `${TEMPLATE_ROOT}/console.hbs` },
        navigation: { template: `${TEMPLATE_ROOT}/navigation.hbs` },
        characters: { template: `${TEMPLATE_ROOT}/characters.hbs`, scrollable: [".gm-panes"] },
        quickRolls: { template: `${TEMPLATE_ROOT}/quick-rolls.hbs`, scrollable: [""] },
        combat: { template: `${TEMPLATE_ROOT}/combat.hbs`, scrollable: [".gm-combat-panes"] },
    };

    tabGroups = { "gm-console-primary": "characters" };

    constructor({ openCharacterSheet, ...options } = {}) {
        super(options);
        this.openCharacterSheet = openCharacterSheet;
        this.paneViews = new Map();
        this.combatPaneViews = new Map();
        this.quickRolls = new QuickRollController();
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
        if (!game.combat && this.tabGroups["gm-console-primary"] === "combat") {
            this.tabGroups["gm-console-primary"] = "characters";
        }
        const tabs = this._prepareTabs("gm-console-primary");
        if (!game.combat) delete tabs.combat;
        return {
            actors: await Promise.all(actors.map((actor) => this.#prepareActor(actor, collapsed.has(actor.id)))),
            candidates: candidates.map((actor) => ({ id: actor.id, name: actor.name, selected: selected.has(actor.id) })),
            layout: game.settings.get(MODULE_ID, GM_CONSOLE_LAYOUT_SETTING),
            tabs,
            quickRolls: this.quickRolls.prepareContext(),
            combat: await prepareGMCombat(game.combat, this.combatPaneViews),
        };
    }

    async _preparePartContext(partId, context, options) {
        const partContext = await super._preparePartContext(partId, context, options);
        if (partId === "characters") partContext.tab = context.tabs.characters;
        if (partId === "quickRolls") {
            partContext.tab = context.tabs["quick-rolls"];
            Object.assign(partContext, context.quickRolls);
        }
        if (partId === "combat") {
            partContext.tab = context.tabs.combat;
            Object.assign(partContext, context.combat);
        }
        return partContext;
    }

    async #prepareActor(actor, collapsed = false) {
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
            isSpellcasting: activeView === "spellcasting",
            inventory: activeView === "inventory" && !collapsed ? prepareGMInventory(actor) : null,
            spellcasting: activeView === "spellcasting" && !collapsed ? await prepareGMSpellcasting(actor) : null,
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
            ...["createCombat", "updateCombat", "deleteCombat"].map((hook) => [
                hook, Hooks.on(hook, () => void this.#refreshCombat()),
            ]),
            ...["createCombatant", "updateCombatant", "deleteCombatant"].map((hook) => [
                hook, Hooks.on(hook, (combatant) => {
                    if (combatant.parent === game.combat) void this.#refreshCombat();
                }),
            ]),
            ["targetToken", Hooks.on("targetToken", (user) => {
                if (user.id === game.user.id) this.#syncPlayerTargetInputs();
            })],
            ["canvasReady", Hooks.on("canvasReady", () => void this.#refreshPlayerTargets())],
            ...["createToken", "deleteToken"].map((hook) => [
                hook,
                Hooks.on(hook, (token) => {
                    if (token.parent === canvas?.scene) void this.#refreshPlayerTargets();
                }),
            ]),
            ["updateToken", Hooks.on("updateToken", (token, changes) => {
                if (token.parent === canvas?.scene && Object.hasOwn(changes, "actorId")) void this.#refreshPlayerTargets();
            })],
            ["updateUser", Hooks.on("updateUser", (_user, changes) => {
                if (Object.hasOwn(changes, "character")) void this.#refreshPlayerTargets();
            })],
            ...["createItem", "updateItem", "deleteItem"].map((hook) => [
                hook,
                Hooks.on(hook, (item) => {
                    if (item.parent?.type === "character") void this.#refreshActor(item.parent);
                    else if (item.parent?.type === "npc") void this.#refreshCombatActor(item.parent);
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
        this.element.querySelector('[name="quick-roll-input"]')?.addEventListener("keydown", (event) => {
            if (event.key !== "Enter") return;
            event.preventDefault();
            void this.#runQuickInput(event, event.currentTarget);
        }, { signal: this.#listeners.signal });
        this.#syncPlayerTargetInputs();
    }

    _tearDown(options) {
        this.#listeners.abort();
        for (const [hook, id] of this.#hookIds) Hooks.off(hook, id);
        this.#hookIds = [];
        super._tearDown(options);
    }

    #listeners = new AbortController();
    #hookIds = [];

    async #refreshPlayerTargets() {
        if (this.rendered) await this.render({ parts: ["quickRolls"] });
    }

    async #refreshCombat() {
        if (!this.rendered) return;
        if (!game.combat && this.tabGroups["gm-console-primary"] === "combat") {
            this.changeTab("characters", "gm-console-primary");
        }
        const activeIds = new Set((game.combat?.turns ?? []).map((combatant) => combatant.id));
        for (const id of this.combatPaneViews.keys()) if (!activeIds.has(id)) this.combatPaneViews.delete(id);
        await this.render({ parts: ["navigation", "combat"] });
    }

    async #refreshCombatActor(actor) {
        if (!this.rendered || !(game.combat?.turns ?? []).some((combatant) => combatant.actor === actor)) return;
        await this.render({ parts: ["combat"] });
    }

    #syncPlayerTargetInputs() {
        const root = this.element?.querySelector(".gm-quick-rolls__targets");
        if (!root) return;
        const targets = game.user?.targets ?? new Set();
        const inputs = [...root.querySelectorAll('[data-action="targetPlayerToken"]')];
        for (const input of inputs) {
            const token = canvas?.ready ? canvas.scene?.tokens.get(input.dataset.tokenId)?.object : null;
            input.checked = !!token && targets.has(token);
        }
        const all = root.querySelector('[data-action="targetAllPlayerTokens"]');
        if (!all) return;
        const selected = inputs.filter((input) => input.checked).length;
        all.checked = inputs.length > 0 && selected === inputs.length;
        all.indeterminate = selected > 0 && selected < inputs.length;
    }

    #actorFor(target) {
        const combatantId = target.closest("[data-combatant-id]")?.dataset.combatantId;
        const combatActor = game.combat?.combatants?.get(combatantId ?? "")?.actor;
        if (combatActor?.type === "npc") return combatActor;
        const id = target.closest("[data-actor-id]")?.dataset.actorId;
        const actor = game.actors.get(id ?? "");
        return actor?.type === "character" ? actor : null;
    }

    #itemFor(target) {
        const actor = this.#actorFor(target);
        const itemId = target.closest("[data-item-id]")?.dataset.itemId;
        return actor?.inventory?.get(itemId ?? "") ?? null;
    }

    #spellFor(target) {
        const actor = this.#actorFor(target);
        const row = target.closest("[data-spell-id]");
        const collection = actor?.spellcasting?.collections.get(row?.dataset.entryId ?? "");
        const spell = collection?.get(row?.dataset.spellId ?? "");
        return actor && collection && spell ? { actor, collection, spell, row } : null;
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
        if (actor.type === "npc") return this.#refreshCombatActor(actor);
        if (!this.rendered) return;
        const current = this.element.querySelector(`.gm-character-pane[data-actor-id="${CSS.escape(actor.id)}"]`);
        if (!current) return;
        const collapsed = game.settings.get(MODULE_ID, GM_CONSOLE_COLLAPSED_ACTORS_SETTING).includes(actor.id);
        const html = await foundry.applications.handlebars.renderTemplate(`${TEMPLATE_ROOT}/character-pane.hbs`, { actors: [await this.#prepareActor(actor, collapsed)], layout: "targeted" });
        const wrapper = current.ownerDocument.createElement("div");
        wrapper.innerHTML = html.trim();
        const replacement = wrapper.querySelector(".gm-character-pane");
        if (replacement) current.replaceWith(replacement);
    }

    #combatantFor(target) {
        const id = target.closest("[data-combatant-id]")?.dataset.combatantId;
        const combatant = game.combat?.combatants?.get(id ?? "");
        return combatant?.actor?.type === "npc" ? combatant : null;
    }

    static async #switchCombatView(_event, target) {
        const combatant = this.#combatantFor(target);
        const view = target.dataset.view;
        if (!combatant || !["overview", "actions", "inventory", "spellcasting"].includes(view)) return;
        this.combatPaneViews.set(combatant.id, view);
        await this.render({ parts: ["combat"] });
    }

    static #openCombatantSheet(_event, target) { this.#combatantFor(target)?.actor?.sheet.render(true); }

    static async #rollCombatStatistic(_event, target) {
        await this.#combatantFor(target)?.actor?.getStatistic?.(target.dataset.statistic)?.roll();
    }

    static async #rollCombatStrike(event, target) {
        const actor = this.#combatantFor(target)?.actor;
        if (!actor) return;
        await ActionController.attack(actor, {
            strikeIndex: target.closest("[data-strike-index]")?.dataset.strikeIndex,
            variantIndex: target.dataset.variantIndex,
        }, event);
    }

    static async #useCombatAction(event, target) {
        const actor = this.#combatantFor(target)?.actor;
        const itemId = target.closest("[data-item-id]")?.dataset.itemId;
        if (actor?.items.get(itemId ?? "")?.type === "action") await ActionController.use(actor, itemId, event);
    }

    async #updateInventoryField(input) {
        const actor = this.#actorFor(input);
        const item = this.#itemFor(input);
        if (!actor?.isOwner || !item) return;
        if (input.dataset.inventoryField === "quantity") {
            const quantity = Number(input.value);
            if (Number.isFinite(quantity)) await item.update({ "system.quantity": quantity });
        } else if (input.dataset.inventoryField === "carry") {
            const carryStates = {
                "held-1": { carryType: "held", handsHeld: 1 },
                "held-2": { carryType: "held", handsHeld: 2 },
                worn: {
                    carryType: "worn",
                    handsHeld: 0,
                    inSlot: item.system.equipped?.inSlot === true,
                },
                stowed: { carryType: "stowed", handsHeld: 0 },
                dropped: { carryType: "dropped", handsHeld: 0 },
            };
            const carryState = carryStates[input.value];
            if (carryState) await actor.changeCarryType(item, carryState);
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
        if (!actor || !["overview", "inventory", "spellcasting"].includes(view)) return;
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

    static async #toggleSpellSummary(_event, target) {
        const resolved = this.#spellFor(target);
        const summary = resolved?.row.querySelector(".gm-spell-summary");
        if (!resolved || !summary) return;
        if (!summary.hidden) {
            summary.hidden = true;
            return;
        }
        const description = await resolved.spell.getDescription({ secrets: resolved.spell.isOwner });
        summary.innerHTML = description.value;
        summary.hidden = false;
    }

    static #openSpell(_event, target) {
        this.#spellFor(target)?.spell.sheet.render(true);
    }

    static async #castSpell(_event, target) {
        const resolved = this.#spellFor(target);
        if (!resolved?.actor.isOwner || !resolved.spell.isOwner) return;
        const rank = Number(resolved.row.dataset.rank);
        const slotId = Number(resolved.row.dataset.slotId);
        if (!Number.isInteger(rank) || rank < 1 || rank > 10) return;
        await resolved.collection.entry.cast(resolved.spell, {
            rank,
            ...(Number.isInteger(slotId) ? { slotId } : {}),
        });
        await this.#refreshActor(resolved.actor);
    }

    static async #toggleInvested(_event, target) {
        const actor = this.#actorFor(target);
        const item = this.#itemFor(target);
        if (actor?.isOwner && !item?.isStowed && item?.isIdentified && item.isInvested !== null) {
            await actor.toggleInvested(item.id);
        }
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

    static #selectDamageType(_event, target) {
        this.quickRolls.selectDamageType(target.dataset.damageType, this.element);
        this.#focusQuickInput();
    }

    static async #quickCheck(event, target) {
        const input = this.element.querySelector('[name="quick-roll-input"]');
        const posted = await this.quickRolls.postCheck(target.dataset.check ?? "", input?.value ?? "");
        if (posted && input) input.value = "";
        else if (!posted) this.#warnQuickRoll();
        this.#focusQuickInput();
    }

    static async #submitQuickRoll(event) {
        const input = this.element.querySelector('[name="quick-roll-input"]');
        if (input) await this.#runQuickInput(event, input);
    }

    static #targetPlayerToken(_event, target) {
        this.quickRolls.setPlayerTarget(target.dataset.tokenId, target.checked);
        this.#syncPlayerTargetInputs();
    }

    static #targetAllPlayerTokens(_event, target) {
        const tokenIds = [...this.element.querySelectorAll('[data-action="targetPlayerToken"]')]
            .map((input) => input.dataset.tokenId);
        this.quickRolls.setAllPlayerTargets(tokenIds, target.checked);
        this.#syncPlayerTargetInputs();
    }

    async #runQuickInput(event, input) {
        const processed = await this.quickRolls.processInput(input.value, event);
        if (processed) input.value = "";
        else this.#warnQuickRoll();
        this.#focusQuickInput();
    }

    #focusQuickInput() {
        this.element.querySelector('[name="quick-roll-input"]')?.focus();
    }

    #warnQuickRoll() {
        ui.notifications.warn(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.GMConsole.QuickRolls.Invalid"));
    }
}
