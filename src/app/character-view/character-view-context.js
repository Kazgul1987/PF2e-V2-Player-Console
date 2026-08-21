import { TABS } from "../../constants.js";
import { CharacterAdapter } from "../../pf2e/character-adapter.js";
import { ActionsAdapter } from "../../pf2e/actions-adapter.js";
import { BiographyAdapter } from "../../pf2e/biography-adapter.js";
import { CraftingAdapter } from "../../pf2e/crafting-adapter.js";
import { EffectsAdapter } from "../../pf2e/effects-adapter.js";
import { FeatsAdapter } from "../../pf2e/feats-adapter.js";
import { InventoryAdapter } from "../../pf2e/inventory-adapter.js";
import { PFSAdapter } from "../../pf2e/pfs-adapter.js";
import { ProficienciesAdapter } from "../../pf2e/proficiencies-adapter.js";
import { SpellcastingAdapter } from "../../pf2e/spellcasting-adapter.js";

export const CHARACTER_TEMPLATE = Object.freeze(Object.fromEntries(
    TABS.map((tab) => [tab, `modules/pf2e-v2-player-console/src/templates/character-sheet/${tab}.hbs`]),
));

/** Prepare the common, actor-explicit view model used by sheets and console panes. */
export async function prepareCharacterView(actor, { activeTab = "character", editable = false } = {}) {
    const tab = TABS.includes(activeTab) ? activeTab : "character";
    const context = {
        actor: CharacterAdapter.prepare(actor),
        actorId: actor.id,
        editable,
        tabs: Object.fromEntries(TABS.map((id) => [id, {
            id,
            active: id === tab,
            cssClass: id === tab ? "active" : "",
            label: `PF2E_V2_PLAYER_CONSOLE.Tabs.${id}`,
        }])),
    };
    if (tab === "inventory") context.inventory = InventoryAdapter.prepare(actor);
    if (tab === "actions") context.actions = ActionsAdapter.prepare(actor);
    if (tab === "feats") context.feats = FeatsAdapter.prepare(actor);
    if (tab === "spellcasting") context.spellcasting = await SpellcastingAdapter.prepare(actor);
    if (tab === "crafting") context.crafting = await CraftingAdapter.prepare(actor);
    if (tab === "proficiencies") context.proficiencies = ProficienciesAdapter.prepare(actor, editable);
    if (tab === "effects") context.effects = EffectsAdapter.prepare(actor, editable);
    if (tab === "biography") context.biography = await BiographyAdapter.prepare(actor, editable);
    if (tab === "pfs") context.pfs = PFSAdapter.prepare(actor);
    context.tab = context.tabs[tab];
    return context;
}
