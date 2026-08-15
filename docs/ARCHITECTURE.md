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

Because navigation buttons and content panels share `data-group` and `data-tab`, tab-local runtime listeners must bind to `.tab-panel[data-group="primary"][data-tab="..."]`. A bare `[data-tab="..."]` listener root is ambiguous and can select the navigation button instead of the content panel. The selector remains application-local through `this.element`, has no `.active` dependency, and therefore also works for initially inactive tabs and detached sheets.

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

`ProficienciesAdapter` maps prepared PF2e Statistics (perception, saves, Lore, class DCs, and base spellcasting) plus prepared attack/defense proficiency records to primitive template rows. Core-skill display specifically mirrors PF2e's prepared `system.skills.<slug>` trace (`rank`, `value`, and `dc`), the same representation consumed by Core's proficiency template. It formats only existing numeric totals and maps Core's 0–4 rank values to `PF2E.ProficiencyLevel*` localization; it performs no level, rank, modifier, attack, AC, or DC calculation.

`ProficienciesController` owns the narrow mutation boundary. It permits regular skill rank updates only for own keys of `CONFIG.PF2E.skills`, without requiring an entry in the partial raw `system.skills` source; Lore rank updates only on the resolved Lore Item; and attack rank updates only for source-backed `custom:true` entries. It validates permission and rank again at runtime and never accepts an arbitrary path from markup. Read-only and derived/synthetic rows are text. Application listeners are scoped to the Proficiencies part under `this.element`, so detached sheets do not depend on the main window DOM; shared Actor/Item hooks provide live prepared-data refresh.

Rank controls await the PF2e Document update before requesting their final render. The adapter then reads the Actor's newly prepared core-skill trace and retains no skill or modifier reference. Rolls independently resolve the current PF2e Statistic runtime API; display and rolls therefore remain PF2e-owned without local proficiency mathematics.

## Milestone 9 effects slice

`EffectsAdapter` is a mutation-free projection. Effects and afflictions come from PF2e embedded `actor.itemTypes.effect` and `actor.itemTypes.affliction`; conditions come specifically from prepared `actor.conditions.active`, including readonly prepared conditions, rather than being reconstructed from `actor.items`. Valued state is identified by `ConditionPF2e.system.value.isValued`; duration/expiry uses `EffectPF2e.remainingDuration` and `isExpired`.

`EffectsController` resolves every ID back to a live PF2e document and exposes only explicit actions. Condition changes delegate to `actor.increaseCondition` / `actor.decreaseCondition`; persistent recovery delegates to `condition.rollRecovery`; forced removal still delegates to Core. Effect counters and Affliction stages call their document `increase` / `decrease` methods, allowing Core to own bounds, removal, and linked stage effects. Effect deletion uses its embedded document lifecycle and is omitted for grants. Supported drops use Foundry drop-data resolution, then the Actor condition API or Core's clone-to-clear-ID embedded Item flow; granted drops are rejected. Rule elements, Active Effects V2, roll options, synthetics, and prepared values are never interpreted or updated by the module. Listeners remain scoped to the Application element for detached-window safety.

## Milestone 10 biography slice

`BiographyAdapter` reads the raw PF2e Actor biography, enriches the six Core HTML fields through PF2e's public runtime `game.pf2e.TextEditor` (with the Foundry V14 text editor as a fallback), and applies owner-or-section-visibility filtering before building the part context. No system source is deep-imported; PF2e therefore owns `@Check`, `@Damage`, configured enrichers, and user-visibility processing. `BiographyController` exposes only explicit simple, rich, visibility, and `edicts`/`anathema` field whitelists; list mutations copy raw source arrays and validate indices.

Biography rich-text editing uses explicit Application V2 actions and Foundry V14's form-associated `HTMLProseMirrorElement`, which owns a `ProseMirrorEditor`, provides `save()`/`value`, and destroys the editor when disconnected. There is no reliance on the V1 `activateEditor`/`saveEditor` lifecycle and no global form. Each field mounts locally, starts from raw Actor source, and has local Save/Cancel controls. Only one editor may exist; update-hook renders are deferred to protect unsaved content, while Save, Cancel, and sheet close disconnect it. All Biography listeners use the existing AbortController and the unambiguous application-local `.tab-panel[data-group="primary"][data-tab="biography"]` root, preserving detached and native-tab behavior.

## Milestone 11 PFS slice

`PFSAdapter` is a mutation-free projection of `system.pfs` and PF2e's prepared `actor.pfsBoons` collection. Faction identity and labels come from runtime `CONFIG.PF2E.pfsFactions`; School is intentionally absent because the current Core PFS template no longer exposes it. `PFSController` owns explicit whitelisted number, level-bump, faction, and reputation updates plus live Item open/chat/summary/delete operations. It never accepts a persisted path from DOM data and never implements level-bump or reputation mechanics.

Item-based summary rendering is centralized in `src/pf2e/item-summary.js`. It delegates to the PF2e Item document's public `getDescription()` runtime API, so Core owns enrichment, description alterations, predicate overrides, addenda, roll data, secrets, and GM visibility; the module does not reconstruct that pipeline. A PF2e-aware TextEditor followed by Foundry TextEditor is retained only for documents without that method. Summary HTML is produced on expansion, never cached or persisted.

Boon discovery delegates to `game.pf2e.compendiumBrowser.tabs.feat`, cloning Core's public filter-data/open sequence with category `pfsboon` and maximum `actor.level`. Like Core, the discovery-only Browse button is not edit-gated and performs no Actor mutation. Addition remains the edit-gated browser-to-sheet drag/drop interaction: drop data is resolved by Foundry/PF2e, only a real Feat whose existing category is `pfsboon` is accepted, same-Actor drops are ignored, and external sources are embedded without their `_id` while rules, flags, and grants remain intact.

All PFS change, keyboard, and drag/drop listeners attach through the established `.tab-panel[data-group="primary"][data-tab="pfs"]` helper without `.active`. Targets use optional `closest`, listeners share the render `AbortController`, and there are no global or realm-sensitive DOM accesses, preserving native tabs and detached-window safety.

## Theme and UI Architecture

The sheet presentation is a sheet-local design system. `src/settings.js` registers the client-scoped `theme` and `density` preferences and rerenders open consoles when either changes. The Application root receives `data-theme` and `data-density`; no class or data attribute is written to `html` or `body`, so normal and detached windows remain isolated.

`character-sheet.css` defines semantic color tokens for application, panel and alternate surfaces, borders, text, headings (`--pf2e-v2-heading` and `--pf2e-v2-heading-muted`), accent, status, highlight, and focus colors. Remaster is the default green/parchment palette, Classic substitutes burgundy/parchment/brass values, and Dark uses low-glare charcoal/slate surfaces with readable desaturated accents. Components consume these tokens rather than maintaining tab-specific palettes. Density also supplies `--pf2e-v2-icon-control-size` and `--pf2e-v2-icon-size`, keeping icon-only controls distinct from readable text controls.

Density is likewise token-driven: comfortable and compact values alter row height, control height and padding, gaps, and section spacing without materially shrinking text. Shared shell, navigation, section framing, item rows and summaries, stat cards, badges, controls, inputs, focus states, and empty states apply across all tab templates.

Responsive rules progressively collapse dashboard and tab grids at 64rem, 48rem, and 34rem. Navigation becomes horizontally scrollable rather than dropping controls, row controls wrap, and nested inventory uses only a subtle border and indentation. This detached-first strategy supports narrow pop-outs while retaining wide multi-column layouts. The design uses CSS, system fonts, Font Awesome, and existing runtime item images only; it adds no binary artwork or fonts.
