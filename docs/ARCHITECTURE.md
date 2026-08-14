# Architecture decisions

## Product and boundary

PF2e V2 Player Console is a full alternative PF2e character sheet whose long-term target is feature parity with the official character sheet. Keeping the core sheet available during development is only a comparison and fallback mechanism, not a product-scope limitation. The V2 sheet is intended to become a selectable registered Actor sheet. All normal character-sheet capabilities are in scope over later milestones, while detached/pop-out operation on a second monitor is a first-class requirement.

PF2e remains responsible for rules preparation, statistics, checks, modifiers, degrees of success, chat output, and document validation. This module owns the V2 presentation, PARTS/tabs, interaction orchestration, narrowly reviewed document updates, localization, and detached UX. It does not import PF2e build aliases or reproduce rules calculations.

Reusable Handlebars partial paths are declared once in `src/constants.js` and preloaded through Foundry V14's `foundry.applications.handlebars.loadTemplates` during module initialization. The launcher also awaits that single cached preload promise before its first render, so the direct module API remains a reliable debug/fallback path even if it is invoked unusually early.

The Actor Directory launcher follows the V14 `getActorContextOptions` contract and resolves its HTMLElement through `data-entry-id`; it does not rely on the pre-V14 `data-document-id` shape. The direct `game.modules.get("pf2e-v2-player-console").api.openCharacterSheet(actor)` API remains available independently of directory and sheet integrations.

Release metadata deliberately uses stable, versionless GitHub release-asset URLs under `releases/latest/download/`. `scripts/prepare-release.mjs` changes the manifest version while reasserting those stable `manifest` and `download` URLs; `scripts/validate.mjs` derives and checks both paths from the canonical repository URL and module ID.

## Sheet base: `HandlebarsApplicationMixin(DocumentSheetV2)`

Milestone 2 migrates from plain `ApplicationV2` to `HandlebarsApplicationMixin(DocumentSheetV2)`. Foundry V14's `DocumentSheetV2` is the appropriate long-lived base because it adds the Actor binding (`document`), document-sheet visibility/editability and lifecycle, standard form behavior, and compatibility with sheet registration while retaining Application V2 rendering, `PARTS`, `TABS`, actions, and `detachWindow()`. No technical blocker was found. This also provides the correct foundation for later embedded-Item and drag/drop work without implementing those Milestone 3 features now.

The standard DocumentSheet constructor receives `{ document: actor }`; `document` is the source of truth and the `actor` getter is only a readable alias. The current directory launcher and instance map remain available. Future alternative-sheet registration uses Foundry's `foundry.documents.collections.Actors.registerSheet` contract; registration is deliberately not enabled until the current slice is suitable as a default/selectable full sheet.

## Permissions and focused editing

`DocumentSheetV2.isEditable` governs editable markup and follows its configured document permission threshold. The sheet has no global form and no global Save button: independent inventory, spell, feat, crafting, and biography interactions must not share a browser-submit lifecycle. HP, hero points, and XP remain display-only until their PF2e semantics are reviewed; there is no generic field-name update path.

The character-name input is a focused interaction outside a form. Its change/blur path trims and validates the value, skips unchanged names, rechecks both `isEditable` and `document.canUserModify(game.user, "update")`, and only then calls `document.update({ name })`. Enter prevents its default behavior and blurs the field to use that same update path; Escape restores the current document name. Read-only users receive text instead of an input. With no form or submit control, name editing cannot trigger native browser navigation.

## Rolls

All roll actions remain template-to-controller calls. `RollController` resolves `actor.getStatistic(slug)` and calls `Statistic.roll(params)`; it never constructs a formula. Its check-event params mirror PF2e's current internal `eventToRollParams`: `showCheckDialogs` determines the default, Shift inverts it, and Ctrl/Meta requests `gm` for a GM or `blind` otherwise. Secret Perception adds `extraRollOptions: ["secret"]`, matching the creature sheet special case.

## Tabs, PARTS, rendering, and detached windows

Stable technical tab IDs use native V2 `TABS`, `_prepareTabs`, `tabGroups`, and `data-action="tab"`; visible labels come from the module localization namespace. Every primary tab has its own Handlebars PART. Later tabs stay explicit placeholders—no Inventory or other Milestone 3 behavior is introduced.

The primary navigation root is `<nav class="tabs sheet-tabs" data-group="primary">`, allowing Application V2 to identify it as the navigation element for that tab group. Its buttons use `data-action="tab"`, `data-group="primary"`, and `data-tab="<id>"`; each separate content PART uses `class="tab ..."`, `data-group="primary"`, and the matching `data-tab="<id>"`. Tab clicks therefore stay on Foundry's native `_onClickTab()` / `changeTab()` path without application-owned click listeners.

The primary tab group is `primary`, with the IDs `character`, `actions`, `inventory`, `spellcasting`, `crafting`, `proficiencies`, `feats`, `effects`, `biography`, and `pfs`. Each corresponding PART renders one `.tab` content root whose `data-group` and `data-tab` exactly match its navigation button. `_preparePartContext()` passes the entry returned by `_prepareTabs("primary")` to that PART as `tab`, and each template renders `tab.cssClass`. Foundry's prepared tab metadata and `tabGroups` are therefore the only active-state source; the sheet does not duplicate it with a custom `isActive` flag. Navigation labels remain localization keys in the prepared V2 tab model and are localized once by `navigation.hbs`. Full document-hook renders retain the Application V2 instance's `tabGroups`, so an Actor update does not reset the selected tab.

`DocumentSheetV2` inherits Application V2 rendering and `detachWindow()`. All handlers operate on event/form arguments and Documents, never a global `document.querySelector`, so the same focused editing, tabs, rolls, and updates work in the detached document. Actor and embedded-Item hooks remain registered and UUID-filtered because automatic coverage of every embedded update is not assumed; they are removed on close.

## M3 final transfer compatibility boundary

PF2e Core's creature trade negotiation uses the source-private `TradeDialog` application and `TradeDialog.canTrade(...)`; it has no stable external runtime entry point. **Creature-to-creature trade negotiation is currently intentionally more restrictive than PF2e Core because the Core trade application is not exposed as a stable external runtime API.** The controller blocks the unsafe non-GM fallback and directs the user to the official sheet.

The same compatibility rule applies to credits: PF2e deliberately keeps `transferCredits` out of its callable API. The module recognizes Core credsticks exactly as treasure items with `system.category === "credstick"` and safely blocks them before `transferItemToActor`. Its own `DialogV2` receives rendered HTML as a string and reads submission data from the clicked button's nearest form, so opening it from a detached sheet does not require the main-window global `document`.

## Milestone 6: spellcasting vertical slice

`SpellcastingAdapter` iterates `actor.spellcasting.collections` and normalizes each entry's asynchronous PF2e `getSheetData()` result into an ID-only template model. `SpellcastingController` resolves those IDs back to live collections/documents and delegates casting, adding, preparation, expended state, classic prepared-slot swaps, chat, and rolls to PF2e. Slot swaps require a non-flexible prepared document entry, valid non-negative source and target indices, and matching entry/group metadata; every other drop remains on the existing Core add/prepare route. It contains no slot, focus-point, innate-use, heightening, eligibility, or DC calculations. Spell summaries reuse the existing `TextEditor.enrichHTML` pattern. Targeted actions and application-local drag/drop listeners remain detached-safe; spellcasting is not a form and has no save operation.

## Milestone 7: crafting vertical slice

`CraftingAdapter` asynchronously consumes `actor.crafting.getFormulas()` and every runtime `CraftingAbility.getSheetData()` result, exposing only presentation fields and primitive identifiers. It derives `hasDailyCrafting` from the live abilities using Core's daily/alchemical predicate and reads `dailyComplete` from `flags.pf2e.dailyCraftingComplete`. `CraftingController` resolves identifiers back to live abilities/items and delegates preparation, quantity, unpreparation, ability crafting, daily crafting, and known-formula checks to PF2e; before either daily call it independently verifies the live ability predicate and the required completion state. PF2e alone controls predicates, batches, slot/resource validation and consumption, temporary Item creation, DCs, and daily state. Application-local change, keyboard, and drop listeners keep the slice detached-safe and avoid a global form.

## Milestone 8 proficiency slice

`ProficienciesAdapter` maps prepared PF2e Statistics (`perception`, saves, skills, Lore, class DCs, and base spellcasting) plus prepared attack/defense proficiency records to primitive template rows. It formats only existing numeric totals and maps Core's 0–4 rank values to `PF2E.ProficiencyLevel*` localization; it performs no level, rank, modifier, attack, AC, or DC calculation.

`ProficienciesController` owns the narrow mutation boundary. It permits regular skill rank updates only for own keys of `CONFIG.PF2E.skills`, without requiring an entry in the partial raw `system.skills` source; Lore rank updates only on the resolved Lore Item; and attack rank updates only for source-backed `custom:true` entries. It validates permission and rank again at runtime and never accepts an arbitrary path from markup. Read-only and derived/synthetic rows are text. Application listeners are scoped to the Proficiencies part under `this.element`, so detached sheets do not depend on the main window DOM; shared Actor/Item hooks provide live prepared-data refresh.
