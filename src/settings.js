import { MODULE_ID } from "./constants.js";

export const THEME_SETTING = "theme";
export const DENSITY_SETTING = "density";
export const ORNAMENTATION_SETTING = "ornamentation";
export const SIDEBAR_SETTING = "showSidebar";
export const GM_LAYOUT_SETTING = "gmConsoleLayout";
export const GM_ACTORS_SETTING = "gmConsoleActors";
export const GM_ACTORS_INITIALIZED_SETTING = "gmConsoleActorsInitialized";
export const GM_FOCUSED_SETTING = "gmConsoleFocusedActor";

/** Register client-owned presentation preferences. */
export function registerSettings(onPresentationChange, onSidebarChange, onConsoleStructureChange) {
    game.settings.register(MODULE_ID, THEME_SETTING, {
        name: "PF2E_V2_PLAYER_CONSOLE.Settings.Theme.Name",
        hint: "PF2E_V2_PLAYER_CONSOLE.Settings.Theme.Hint",
        scope: "client",
        config: true,
        type: String,
        choices: {
            remaster: "PF2E_V2_PLAYER_CONSOLE.Settings.Theme.Remaster",
            classic: "PF2E_V2_PLAYER_CONSOLE.Settings.Theme.Classic",
            dark: "PF2E_V2_PLAYER_CONSOLE.Settings.Theme.Dark",
        },
        default: "remaster",
        onChange: onPresentationChange,
    });

    game.settings.register(MODULE_ID, DENSITY_SETTING, {
        name: "PF2E_V2_PLAYER_CONSOLE.Settings.Density.Name",
        hint: "PF2E_V2_PLAYER_CONSOLE.Settings.Density.Hint",
        scope: "client",
        config: true,
        type: String,
        choices: {
            comfortable: "PF2E_V2_PLAYER_CONSOLE.Settings.Density.Comfortable",
            compact: "PF2E_V2_PLAYER_CONSOLE.Settings.Density.Compact",
        },
        default: "comfortable",
        onChange: onPresentationChange,
    });

    game.settings.register(MODULE_ID, ORNAMENTATION_SETTING, {
        name: "PF2E_V2_PLAYER_CONSOLE.Settings.Ornamentation.Name",
        hint: "PF2E_V2_PLAYER_CONSOLE.Settings.Ornamentation.Hint",
        scope: "client",
        config: true,
        type: String,
        choices: {
            off: "PF2E_V2_PLAYER_CONSOLE.Settings.Ornamentation.Off",
            subtle: "PF2E_V2_PLAYER_CONSOLE.Settings.Ornamentation.Subtle",
            ornate: "PF2E_V2_PLAYER_CONSOLE.Settings.Ornamentation.Ornate",
        },
        default: "subtle",
        onChange: onPresentationChange,
    });

    game.settings.register(MODULE_ID, SIDEBAR_SETTING, {
        name: "PF2E_V2_PLAYER_CONSOLE.Settings.Sidebar.Name",
        hint: "PF2E_V2_PLAYER_CONSOLE.Settings.Sidebar.Hint",
        scope: "client",
        config: true,
        type: Boolean,
        default: true,
        onChange: onSidebarChange,
    });

    game.settings.register(MODULE_ID, GM_LAYOUT_SETTING, {
        name: "PF2E_V2_PLAYER_CONSOLE.Settings.GMLayout.Name",
        hint: "PF2E_V2_PLAYER_CONSOLE.Settings.GMLayout.Hint",
        scope: "client", config: true, type: String,
        choices: { columns: "PF2E_V2_PLAYER_CONSOLE.Console.Columns", grid: "PF2E_V2_PLAYER_CONSOLE.Console.Grid", focused: "PF2E_V2_PLAYER_CONSOLE.Console.Focused" },
        default: "columns", onChange: onConsoleStructureChange,
    });
    game.settings.register(MODULE_ID, GM_ACTORS_SETTING, {
        name: "PF2E_V2_PLAYER_CONSOLE.Console.SelectCharacters", scope: "client", config: false, type: Array, default: [],
    });
    game.settings.register(MODULE_ID, GM_ACTORS_INITIALIZED_SETTING, {
        name: "PF2E_V2_PLAYER_CONSOLE.Console.SelectCharacters", scope: "client", config: false, type: Boolean, default: false,
    });
    game.settings.register(MODULE_ID, GM_FOCUSED_SETTING, {
        name: "PF2E_V2_PLAYER_CONSOLE.Console.Focus", scope: "client", config: false, type: String, default: "",
    });

}

export function getPresentationSettings() {
    return {
        theme: game.settings.get(MODULE_ID, THEME_SETTING),
        density: game.settings.get(MODULE_ID, DENSITY_SETTING),
        ornamentation: game.settings.get(MODULE_ID, ORNAMENTATION_SETTING),
        showSidebar: game.settings.get(MODULE_ID, SIDEBAR_SETTING),
    };
}
