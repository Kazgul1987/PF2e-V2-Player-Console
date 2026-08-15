import { HANDLEBARS_PARTIALS, LOG_PREFIX, MODULE_ID } from "./constants.js";
import { PF2eCharacterSheetV2 } from "./app/character-sheet/character-sheet-v2.js";
import { CharacterAdapter } from "./pf2e/character-adapter.js";
import { registerSettings } from "./settings.js";

const applications = new Map();
let partialsPromise;

function preloadHandlebarsPartials() {
    partialsPromise ??= foundry.applications.handlebars.loadTemplates(HANDLEBARS_PARTIALS).catch((error) => {
        console.error(`${LOG_PREFIX} Failed to preload Handlebars partials`, { error, paths: HANDLEBARS_PARTIALS });
        throw error;
    });
    return partialsPromise;
}

function actorFromDirectoryEntry(entry) {
    const actor = game.actors.get(entry.dataset.entryId ?? "");
    if (!actor) {
        console.warn(`${LOG_PREFIX} Could not resolve Actor from directory entry`, { entry });
    }
    return actor;
}

export function openCharacterSheet(actor) {
    if (!CharacterAdapter.supports(actor)) {
        ui.notifications.warn(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.CharacterOnly"));
        return null;
    }

    const current = applications.get(actor.uuid);
    const application = current?.rendered ? current : new PF2eCharacterSheetV2({ document: actor });
    applications.set(actor.uuid, application);
    void preloadHandlebarsPartials()
        .then(() => application.render(true))
        .catch(() => undefined);
    return application;
}

Hooks.once("init", () => {
    registerSettings(() => {
        for (const application of applications.values()) {
            if (application.rendered) application.applyPresentationSettings();
        }
    });
    game.modules.get(MODULE_ID).api = { openCharacterSheet, PF2eCharacterSheetV2 };
    void preloadHandlebarsPartials().catch(() => undefined);
    console.info(`${LOG_PREFIX} Initialised`);
});

Hooks.on("getActorContextOptions", (_application, entries) => {
    entries.push({
        label: "PF2E_V2_PLAYER_CONSOLE.Actions.OpenSheet",
        icon: "fa-solid fa-window-restore",
        visible: (entry) => CharacterAdapter.supports(actorFromDirectoryEntry(entry)),
        onClick: (_event, entry) => {
            const actor = actorFromDirectoryEntry(entry);
            if (actor) openCharacterSheet(actor);
        },
    });
});

Hooks.on("getApplicationHeaderButtons", (application, buttons) => {
    if (!CharacterAdapter.supports(application.actor)) return;
    buttons.unshift({
        label: "PF2E_V2_PLAYER_CONSOLE.Actions.OpenSheet",
        class: `${MODULE_ID}-open-sheet`,
        icon: "fas fa-window-restore",
        onclick: () => openCharacterSheet(application.actor),
    });
});

Hooks.on("deleteActor", (actor) => {
    const application = applications.get(actor.uuid);
    if (application) void application.close();
    applications.delete(actor.uuid);
});
