import { LOG_PREFIX, MODULE_ID } from "./constants.js";
import { PF2eCharacterSheetV2 } from "./app/character-sheet/character-sheet-v2.js";
import { CharacterAdapter } from "./pf2e/character-adapter.js";

const applications = new Map();

export function openCharacterSheet(actor) {
    if (!CharacterAdapter.supports(actor)) {
        ui.notifications.warn(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.Errors.CharacterOnly"));
        return null;
    }

    const current = applications.get(actor.uuid);
    const application = current?.rendered ? current : new PF2eCharacterSheetV2({ document: actor });
    applications.set(actor.uuid, application);
    void application.render(true);
    return application;
}

Hooks.once("init", () => {
    game.modules.get(MODULE_ID).api = { openCharacterSheet, PF2eCharacterSheetV2 };
    console.info(`${LOG_PREFIX} Initialised`);
});

Hooks.on("getActorDirectoryEntryContext", (_html, entries) => {
    entries.push({
        name: "PF2E_V2_PLAYER_CONSOLE.Actions.OpenSheet",
        icon: '<i class="fa-solid fa-window-restore"></i>',
        condition: (entry) => CharacterAdapter.supports(game.actors.get(entry.dataset.documentId)),
        callback: (entry) => openCharacterSheet(game.actors.get(entry.dataset.documentId)),
    });
});

Hooks.on("deleteActor", (actor) => {
    const application = applications.get(actor.uuid);
    if (application) void application.close();
    applications.delete(actor.uuid);
});
