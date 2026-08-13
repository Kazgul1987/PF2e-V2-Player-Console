import { LOG_PREFIX, MODULE_ID } from "./constants.js";
import { PF2eCharacterSheetV2 } from "./app/character-sheet/character-sheet-v2.js";
import { CharacterAdapter } from "./pf2e/character-adapter.js";

const applications = new Map();

export function openCharacterSheet(actor) {
    if (!CharacterAdapter.supports(actor)) {
        ui.notifications.warn("PF2e V2 Player Console can only open PF2e characters.");
        return null;
    }

    const current = applications.get(actor.uuid);
    const application = current?.rendered ? current : new PF2eCharacterSheetV2(actor);
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
        name: "Open V2 Character Sheet",
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
