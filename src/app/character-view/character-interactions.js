import { ActionController } from "../../controllers/action-controller.js";
import { BiographyController } from "../../controllers/biography-controller.js";
import { CraftingController } from "../../controllers/crafting-controller.js";
import { EffectsController } from "../../controllers/effects-controller.js";
import { FeatController } from "../../controllers/feat-controller.js";
import { InventoryController } from "../../controllers/inventory-controller.js";
import { PFSController } from "../../controllers/pfs-controller.js";
import { ProficienciesController } from "../../controllers/proficiencies-controller.js";
import { SidebarController } from "../../controllers/sidebar-controller.js";
import { SpellcastingController } from "../../controllers/spellcasting-controller.js";

/** Bind all actor-sensitive controls below one pane root. */
export function bindCharacterPaneListeners({ actor, root, rerender = async () => undefined, signal }) {
    const listenerOptions = signal ? { signal } : undefined;
    const nameInput = root.querySelector("[data-actor-name]");
    nameInput?.addEventListener("change", async (event) => {
        const input = event.currentTarget;
        const name = String(input.value ?? "").trim();
        if (!name || !actor.canUserModify(game.user, "update")) { input.value = actor.name; return; }
        if (name !== actor.name) await actor.update({ name });
    }, listenerOptions);
    nameInput?.addEventListener("keydown", (event) => {
        if (event.key === "Enter") { event.preventDefault(); event.currentTarget.blur(); }
        if (event.key === "Escape") { event.preventDefault(); event.currentTarget.value = actor.name; event.currentTarget.blur(); }
    }, listenerOptions);
        const getTabPanel = (tab) => root.querySelector(
            `.tab-panel[data-group="primary"][data-tab="${tab}"]`,
        );
        const sidebar = root.querySelector(".character-sidebar");
        sidebar?.addEventListener("change", (event) => {
            const input = event.target;
            if (input?.matches?.("[data-hp-current]")) void SidebarController.updateHitPoints(actor, input.value);
        }, listenerOptions);
        sidebar?.addEventListener("keydown", (event) => {
            const input = event.target;
            if (input?.matches?.("[data-hp-current]")) {
                if (event.key === "Enter") { event.preventDefault(); input.blur(); }
                if (event.key === "Escape") { event.preventDefault(); input.value = input.defaultValue; input.blur(); }
                return;
            }
            const heroPoints = event.target?.closest?.("[data-hero-points]");
            if (heroPoints && ["Enter", " "].includes(event.key)) {
                event.preventDefault();
                void SidebarController.adjustHeroPoints(actor, 1);
            }
        }, listenerOptions);
        sidebar?.addEventListener("click", (event) => {
            if (event.target?.closest?.("[data-hero-points]")) void SidebarController.adjustHeroPoints(actor, 1);
        }, listenerOptions);
        sidebar?.addEventListener("contextmenu", (event) => {
            if (!event.target?.closest?.("[data-hero-points]")) return;
            event.preventDefault();
            void SidebarController.adjustHeroPoints(actor, -1);
        }, listenerOptions);
        const actions = getTabPanel("actions");
        actions?.addEventListener("change", (event) => {
            const target = event.target;
            if (!target?.matches?.("input, select")) return;
            const row = target.closest("[data-domain][data-option]");
            if (row && ["toggleRollOption", "toggleRollOptionSuboption"].includes(target.dataset.action)) {
                const checkbox = row.querySelector('input[data-action="toggleRollOption"]');
                const select = row.querySelector('select[data-action="toggleRollOptionSuboption"]');
                void ActionController.toggleRollOption(actor, row.dataset, checkbox?.checked ?? false, select?.value ?? null);
                return;
            }
            if (target.dataset.action === "selectStrikeAmmo") {
                void ActionController.ammo(actor, target.closest("[data-strike-index]")?.dataset ?? {}, target.value);
            }
        }, listenerOptions);
        const inventory = getTabPanel("inventory");
        inventory?.addEventListener("dragstart", (event) => {
            const target = event.target.closest("[draggable][data-item-id]");
            if (target) InventoryController.dragStart(actor, event, target);
        }, listenerOptions);
        inventory?.addEventListener("dragover", (event) => event.preventDefault(), listenerOptions);
        inventory?.addEventListener("drop", (event) => void InventoryController.drop(actor, event, event.target), listenerOptions);
        const feats = getTabPanel("feats");
        feats?.addEventListener("dragstart", (event) => {
            const target = event.target.closest("[draggable][data-item-id]");
            if (target) FeatController.dragStart(actor, event, target);
        }, listenerOptions);
        feats?.addEventListener("dragover", (event) => event.preventDefault(), listenerOptions);
        feats?.addEventListener("drop", (event) => void FeatController.drop(actor, event, event.target), listenerOptions);
        const spellcasting = getTabPanel("spellcasting");
        spellcasting?.addEventListener("click", (event) => {
            const focus = event.target?.closest?.('[data-focus-resource][data-resource="focus"]');
            if (focus) void SpellcastingController.adjustFocus(actor, 1);
        }, listenerOptions);
        spellcasting?.addEventListener("contextmenu", (event) => {
            const focus = event.target?.closest?.('[data-focus-resource][data-resource="focus"]');
            if (!focus) return;
            event.preventDefault();
            void SpellcastingController.adjustFocus(actor, -1);
        }, listenerOptions);
        spellcasting?.addEventListener("dragstart", (event) => {
            const target = event.target?.closest?.("[draggable][data-spell-id]");
            if (target) SpellcastingController.dragStart(actor, event, target);
        }, listenerOptions);
        spellcasting?.addEventListener("dragover", (event) => event.preventDefault(), listenerOptions);
        spellcasting?.addEventListener("drop", (event) => void SpellcastingController.drop(actor, event, event.target), listenerOptions);
        spellcasting?.addEventListener("change", (event) => {
            const input = event.target;
            if (!input?.matches?.("[data-slot-count]")) return;
            void SpellcastingController.updateSlotCount(actor, { ...input.closest("[data-entry-id]")?.dataset, ...input.dataset, value: input.value });
        }, listenerOptions);
        spellcasting?.addEventListener("keydown", (event) => {
            const input = event.target;
            const focus = input?.closest?.('[data-focus-resource][data-resource="focus"]');
            if (focus && ["Enter", " "].includes(event.key)) {
                event.preventDefault();
                void SpellcastingController.adjustFocus(actor, 1);
                return;
            }
            if (!input?.matches?.("[data-slot-count]")) return;
            if (event.key === "Enter") { event.preventDefault(); input.blur(); }
            if (event.key === "Escape") { event.preventDefault(); input.value = input.defaultValue; input.blur(); }
        }, listenerOptions);
        const crafting = getTabPanel("crafting");
        crafting?.addEventListener("change", (event) => {
            const input = event.target;
            if (!input?.matches?.("[data-formula-quantity]")) return;
            const row = input.closest("[data-formula-index]");
            void CraftingController.quantity(actor, row?.closest("[data-crafting-id]")?.dataset.craftingId, Number(row?.dataset.formulaIndex), input.value);
        }, listenerOptions);
        crafting?.addEventListener("keydown", (event) => {
            const input = event.target;
            if (!input?.matches?.("[data-formula-quantity]")) return;
            if (event.key === "Enter") { event.preventDefault(); input.blur(); }
            if (event.key === "Escape") { event.preventDefault(); input.value = input.defaultValue; input.blur(); }
        }, listenerOptions);
        crafting?.addEventListener("dragover", (event) => event.preventDefault(), listenerOptions);
        crafting?.addEventListener("drop", (event) => void CraftingController.drop(actor, event, event.target), listenerOptions);
        const proficiencies = getTabPanel("proficiencies");
        proficiencies?.addEventListener("change", async (event) => {
            const select = event.target;
            if (!select?.matches?.("[data-rank-control]")) return;
            await ProficienciesController.updateRank(actor, { ...select.dataset, rank: Number(select.value) });
            // The resolved document update has completed PF2e preparation: rebuild from the new Statistic objects.
            await rerender();
        }, listenerOptions);
        const effects = getTabPanel("effects");
        effects?.addEventListener("dragstart", (event) => {
            const target = event.target?.closest?.("[draggable][data-item-id]");
            if (target) EffectsController.dragStart(actor, event, target);
        }, listenerOptions);
        effects?.addEventListener("dragover", (event) => event.preventDefault(), listenerOptions);
        effects?.addEventListener("drop", (event) => void EffectsController.drop(actor, event), listenerOptions);
        const biography = getTabPanel("biography");
        biography?.addEventListener("change", (event) => {
            const input = event.target;
            if (input?.matches?.("[data-biography-field]")) {
                void BiographyController.updateText(actor, input.dataset.biographyField, input.value);
            } else if (input?.matches?.("[data-biography-list-input]")) {
                const row = input.closest("[data-biography-list]");
                void BiographyController.updateListEntry(actor, row?.dataset.biographyList, Number(input.dataset.index), input.value);
            }
        }, listenerOptions);
        biography?.addEventListener("keydown", (event) => {
            const input = event.target;
            if (!input?.matches?.("[data-biography-field], [data-biography-list-input]")) return;
            if (event.key === "Enter") { event.preventDefault(); input.blur(); }
            if (event.key === "Escape") {
                event.preventDefault();
                input.value = input.matches("[data-biography-field]")
                    ? BiographyController.value(actor, input.dataset.biographyField)
                    : input.defaultValue;
                input.blur();
            }
        }, listenerOptions);
        const pfs = getTabPanel("pfs");
        pfs?.addEventListener("change", async (event) => {
            const input = event.target;
            let accepted;
            if (input?.matches?.("[data-pfs-number]")) {
                accepted = await PFSController.updateOrganizedPlayNumber(actor, input.dataset.pfsNumber, input.value);
            } else if (input?.matches?.("[data-pfs-level-bump]")) {
                accepted = await PFSController.toggleLevelBump(actor, input.checked);
            } else if (input?.matches?.("[data-pfs-faction]")) {
                accepted = await PFSController.updateFaction(actor, input.value);
            } else if (input?.matches?.("[data-pfs-reputation]")) {
                accepted = await PFSController.updateReputation(actor, input.dataset.pfsReputation, input.value);
            } else return;
            if (!accepted && input.matches("[data-pfs-level-bump]")) {
                input.checked = Boolean(actor.system.pfs.levelBump);
            } else if (!accepted && input.matches("[data-pfs-faction]")) {
                input.value = actor.system.pfs.currentFaction;
            } else if (!accepted) {
                input.value = PFSController.value(actor, input.dataset.pfsNumber, input.dataset.pfsReputation);
            }
        }, listenerOptions);
        pfs?.addEventListener("keydown", (event) => {
            const input = event.target;
            if (!input?.matches?.("[data-pfs-number], [data-pfs-reputation]")) return;
            if (event.key === "Enter") { event.preventDefault(); input.blur(); }
            if (event.key === "Escape") { event.preventDefault(); input.value = input.defaultValue; input.blur(); }
        }, listenerOptions);
        pfs?.addEventListener("dragstart", (event) => {
            const target = event.target?.closest?.("[draggable][data-item-id]");
            if (target) PFSController.dragStart(actor, event, target);
        }, listenerOptions);
        pfs?.addEventListener("dragover", (event) => event.preventDefault(), listenerOptions);
        pfs?.addEventListener("drop", (event) => void PFSController.drop(actor, event), listenerOptions);
}

/** Owns rich-text editor state without relying on a DocumentSheet private brand. */
export class BiographyEditor {
    static #active = new WeakMap();

    static #editors(owner, { create = false } = {}) {
        let editors = this.#active.get(owner);
        if (!editors && create) { editors = new Map(); this.#active.set(owner, editors); }
        return editors;
    }

    static isEditing(owner, actorId = null) {
        const editors = this.#editors(owner);
        return actorId === null ? Boolean(editors?.size) : editors?.has(actorId) ?? false;
    }

    static async open({ actor, root, owner, target, editable }) {
        const editors = this.#editors(owner, { create: true });
        if (editors.has(actor.id) || !editable) return;
        const container = target.closest("[data-richtext-field]");
        if (!root.contains(container)) return;
        const field = container?.dataset.richtextField;
        const raw = BiographyController.richTextValue(actor, field);
        const host = container?.querySelector("[data-richtext-editor-host]");
        const mount = host?.querySelector("[data-richtext-editor-mount]");
        const display = container?.querySelector("[data-richtext-display]");
        if (raw === null || !host || !mount || !display) return;
        const editor = foundry.applications.elements.HTMLProseMirrorElement.create({
            name: `system.details.biography.${field}`, value: raw, documentUUID: actor.uuid,
            collaborate: false, toggled: false,
        });
        editors.set(actor.id, { actor, container, display, editor, field, host });
        display.hidden = true; host.hidden = false; mount.replaceChildren(editor); editor.focus();
    }

    static async save({ owner, actorId, target }) {
        const active = this.#editors(owner)?.get(actorId);
        if (!active || target.closest("[data-richtext-field]") !== active.container) return;
        active.editor.save();
        const value = active.editor.value;
        this.close({ owner, actorId });
        await BiographyController.updateRichText(active.actor, active.field, value);
    }

    static close({ owner, actorId } = {}) {
        const editors = this.#editors(owner);
        if (!editors) return;
        const ids = actorId ? [actorId] : [...editors.keys()];
        for (const id of ids) {
            const active = editors.get(id);
            if (!active) continue;
            active.editor.remove(); active.host.hidden = true; active.display.hidden = false;
            editors.delete(id);
        }
        if (!editors.size) this.#active.delete(owner);
    }
}
