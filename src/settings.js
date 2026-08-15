import { MODULE_ID } from "./constants.js";

export const THEME_SETTING = "theme";
export const DENSITY_SETTING = "density";

/** Register client-owned presentation preferences. */
export function registerSettings(onPresentationChange) {
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
}

export function getPresentationSettings() {
    return {
        theme: game.settings.get(MODULE_ID, THEME_SETTING),
        density: game.settings.get(MODULE_ID, DENSITY_SETTING),
    };
}
