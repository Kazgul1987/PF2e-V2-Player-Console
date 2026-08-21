export const MODULE_ID = "pf2e-v2-player-console";
export const LOG_PREFIX = "PF2e V2 Player Console |";

/** Handlebars templates which are invoked as partials rather than Application V2 PARTS. */
export const HANDLEBARS_PARTIALS = Object.freeze([
    `modules/${MODULE_ID}/src/templates/character-sheet/inventory-item.hbs`,
]);

/**
 * PF2e's item carry-type tuple is internal rather than part of CONFIG.PF2E.
 * Keep this compatibility list centralized and synchronized with PF2e V14.
 */
export const PF2E_ITEM_CARRY_TYPES = Object.freeze([
    "attached",
    "dropped",
    "held",
    "implanted",
    "installed",
    "stowed",
    "worn",
]);

export const TABS = Object.freeze([
    "character", "actions", "inventory", "spellcasting", "crafting",
    "proficiencies", "feats", "effects", "biography", "pfs",
]);
