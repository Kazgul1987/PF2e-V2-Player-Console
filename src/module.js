import { HANDLEBARS_PARTIALS, LOG_PREFIX, MODULE_ID } from "./constants.js";
import { PF2eCharacterSheetV2 } from "./app/character-sheet/character-sheet-v2.js";
import { CharacterAdapter } from "./pf2e/character-adapter.js";
import { registerSettings } from "./settings.js";
import { GMCharacterConsole } from "./app/gm-console/gm-character-console.js";

const applications = new Map();
let partialsPromise;
let gmConsole;

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

export async function openGMConsole() {
    if (!game.user?.isGM) {
        ui.notifications.warn(game.i18n.localize("PF2E_V2_PLAYER_CONSOLE.GMConsole.Errors.GMOnly"));
        return null;
    }
    if (gmConsole?.rendered) {
        gmConsole.bringToFront();
        return gmConsole;
    }
    gmConsole = new GMCharacterConsole({ openCharacterSheet });
    await gmConsole.initializeSelection();
    await gmConsole.render(true);
    return gmConsole;
}

export async function closeGMConsole() {
    if (!game.user?.isGM || !gmConsole) return false;
    await gmConsole.close();
    gmConsole = undefined;
    return true;
}

export async function toggleGMConsole() {
    if (gmConsole?.rendered) return closeGMConsole();
    return openGMConsole();
}

Hooks.once("init", () => {
    const renderedApplications = () => [...applications.values()].filter((application) => application.rendered);
    registerSettings(() => {
        for (const application of renderedApplications()) application.applyPresentationSettings();
    }, () => {
        for (const application of renderedApplications()) void application.render();
    });
    game.modules.get(MODULE_ID).api = {
        openCharacterSheet, PF2eCharacterSheetV2, openGMConsole, closeGMConsole, toggleGMConsole,
    };
    void preloadHandlebarsPartials().catch(() => undefined);
    console.info(`${LOG_PREFIX} Initialised`);
});

Hooks.on("getSceneControlButtons", (controls) => {
    if (!game.user?.isGM) return;
    const actors = Array.isArray(controls) ? controls.find((control) => control.name === "token") : controls.tokens;
    const tools = actors?.tools;
    const action = {
        name: "gmCharacterConsole",
        title: "PF2E_V2_PLAYER_CONSOLE.GMConsole.Open",
        icon: "fa-solid fa-users-gear",
        button: true,
        onClick: () => void openGMConsole(),
    };
    if (Array.isArray(tools)) tools.push(action);
    else if (tools) tools.gmCharacterConsole = action;
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
