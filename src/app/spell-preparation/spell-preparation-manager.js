import { MODULE_ID } from "../../constants.js";
import { SpellcastingController } from "../../controllers/spellcasting-controller.js";
import { SpellcastingAdapter } from "../../pf2e/spellcasting-adapter.js";
import { getPresentationSettings } from "../../settings.js";

const { ApplicationV2, HandlebarsApplicationMixin } = foundry.applications.api;

/** Compact, module-owned UI over PF2e's live prepared-spell collection APIs. */
export class SpellPreparationManager extends HandlebarsApplicationMixin(ApplicationV2) {
    static DEFAULT_OPTIONS = {
        id: `${MODULE_ID}-spell-preparation-{id}`,
        classes: [MODULE_ID, "spell-preparation-manager"],
        position: { width: 760, height: 620 },
        window: { frame: true, positioned: true, resizable: true, minimizable: true },
        actions: {
            prepareKnown: SpellPreparationManager.#prepareKnown,
            prepareSlot: SpellPreparationManager.#prepareSlot,
            unprepareSlot: SpellPreparationManager.#unprepareSlot,
        },
    };

    static PARTS = {
        manager: { template: `modules/${MODULE_ID}/src/templates/spell-preparation/manager.hbs`, scrollable: [".preparation-columns"] },
    };

    constructor({ actor, entryId, ...options }) {
        super(options);
        this.actor = actor;
        this.entryId = entryId;
    }

    get title() {
        return game.i18n.format("PF2E_V2_PLAYER_CONSOLE.Spellcasting.PreparationTitle", { actor: this.actor?.name ?? "" });
    }

    async _prepareContext() {
        try {
            const collection = SpellcastingController.collection(this.actor, this.entryId);
            const manager = await SpellcastingAdapter.prepareManager(collection);
            if (manager) return { ...manager, editable: SpellcastingController.isEditable(this.actor, { notify: false }) };
        } catch (error) {
            console.warn("PF2e V2 Player Console | Preparation manager data is stale or unavailable", error);
        }
        if (this.rendered) {
            ui.notifications.warn(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Spellcasting.PreparationUnavailable"));
        }
        return { unavailable: true };
    }

    async _onFirstRender(context, options) {
        await super._onFirstRender(context, options);
        if (this.actor?.apps) this.actor.apps[this.id] = this;
    }

    _tearDown(options) {
        if (this.actor?.apps?.[this.id] === this) delete this.actor.apps[this.id];
        super._tearDown(options);
    }

    async _onRender(context, options) {
        await super._onRender(context, options);
        const presentation = getPresentationSettings();
        this.element.dataset.theme = presentation.theme;
        this.element.dataset.density = presentation.density;
        this.element.dataset.ornamentation = presentation.ornamentation;
        this.#listeners.abort();
        this.#listeners = new AbortController();
        const root = this.element;
        root.addEventListener("dragstart", (event) => {
            const slot = event.target?.closest?.("[draggable][data-spell-id]");
            if (slot) SpellcastingController.dragStart(this.actor, event, slot);
        }, { signal: this.#listeners.signal });
        root.addEventListener("dragover", (event) => {
            if (SpellcastingController.isEditable(this.actor, { notify: false })) event.preventDefault();
        }, { signal: this.#listeners.signal });
        root.addEventListener("drop", (event) => void this.#drop(event), { signal: this.#listeners.signal });
    }

    #listeners = new AbortController();

    async #refresh(operation) {
        await operation;
        if (this.rendered) await this.render();
    }

    static async #prepareKnown(_event, target) {
        const spellId = target.closest("[data-spell-id]")?.dataset.spellId;
        const targetSlot = await SpellcastingController.chooseSlot(this.actor, this.entryId, spellId);
        if (targetSlot) await this.#refresh(SpellcastingController.prepareDirect(this.actor, { entryId: this.entryId, ...targetSlot, spellId }));
    }

    static async #prepareSlot(_event, target) {
        const row = target.closest("[data-group-id][data-slot-index]");
        const spellId = await SpellcastingController.chooseSpell(this.actor, { entryId: this.entryId, ...row?.dataset });
        if (spellId) await this.#refresh(SpellcastingController.prepareDirect(this.actor, { entryId: this.entryId, ...row.dataset, spellId }));
    }

    static async #unprepareSlot(_event, target) {
        const row = target.closest("[data-group-id][data-slot-index]");
        if (row) await this.#refresh(SpellcastingController.unprepare(this.actor, { entryId: this.entryId, ...row.dataset }));
    }

    async #drop(event) {
        const target = event.target?.closest?.("[data-group-id][data-slot-index]");
        if (!target) return;
        await this.#refresh(SpellcastingController.drop(this.actor, event, target));
    }
}
