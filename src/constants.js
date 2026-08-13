export const MODULE_ID = "pf2e-v2-player-console";
export const LOG_PREFIX = "PF2e V2 Player Console |";

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
