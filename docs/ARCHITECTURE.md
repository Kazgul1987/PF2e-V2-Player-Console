# Architecture decisions

## Product and boundary

PF2e V2 Player Console is a full alternative PF2e character sheet whose long-term target is feature parity with the official character sheet. Keeping the core sheet available during development is only a comparison and fallback mechanism, not a product-scope limitation. The V2 sheet is intended to become a selectable registered Actor sheet. All normal character-sheet capabilities are in scope over later milestones, while detached/pop-out operation on a second monitor is a first-class requirement.

PF2e remains responsible for rules preparation, statistics, checks, modifiers, degrees of success, chat output, and document validation. This module owns the V2 presentation, PARTS/tabs, interaction orchestration, narrowly reviewed document updates, localization, and detached UX. It does not import PF2e build aliases or reproduce rules calculations.

## Sheet base: `HandlebarsApplicationMixin(DocumentSheetV2)`

Milestone 2 migrates from plain `ApplicationV2` to `HandlebarsApplicationMixin(DocumentSheetV2)`. Foundry V14's `DocumentSheetV2` is the appropriate long-lived base because it adds the Actor binding (`document`), document-sheet visibility/editability and lifecycle, standard form behavior, and compatibility with sheet registration while retaining Application V2 rendering, `PARTS`, `TABS`, actions, and `detachWindow()`. No technical blocker was found. This also provides the correct foundation for later embedded-Item and drag/drop work without implementing those Milestone 3 features now.

The standard DocumentSheet constructor receives `{ document: actor }`; `document` is the source of truth and the `actor` getter is only a readable alias. The current directory launcher and instance map remain available. Future alternative-sheet registration uses Foundry's `foundry.documents.collections.Actors.registerSheet` contract; registration is deliberately not enabled until the current slice is suitable as a default/selectable full sheet.

## Permissions and forms

`DocumentSheetV2.isEditable` governs editable markup and follows its configured document permission threshold. Submission is protected again with both `isEditable` and `document.canUserModify(game.user, "update")`; therefore hiding inputs is not the security boundary. Owner users can update, while Observer/Limited behavior follows Foundry visibility/edit-permission semantics and remains read-only in this slice.

The application window content is a real top-level `form`. `DEFAULT_OPTIONS.form` binds the documented Application V2 handler signature `(event, form, FormDataExtended)`, with `submitOnChange: false` and `closeOnSubmit: false`. Enter and the submit button therefore use Application V2 submission and cannot trigger browser navigation. The handler accepts only the reviewed `name` field, trims and validates it, rechecks permission, then calls `document.update({ name })`. HP, hero points, and XP remain display-only until their PF2e semantics are reviewed; there is no generic field-name update path.

## Rolls

All roll actions remain template-to-controller calls. `RollController` resolves `actor.getStatistic(slug)` and calls `Statistic.roll(params)`; it never constructs a formula. Its check-event params mirror PF2e's current internal `eventToRollParams`: `showCheckDialogs` determines the default, Shift inverts it, and Ctrl/Meta requests `gm` for a GM or `blind` otherwise. Secret Perception adds `extraRollOptions: ["secret"]`, matching the creature sheet special case.

## Tabs, PARTS, rendering, and detached windows

Stable technical tab IDs use native V2 `TABS`, `_prepareTabs`, `tabGroups`, and `data-action="tab"`; visible labels come from the module localization namespace. Every primary tab has its own Handlebars PART. Later tabs stay explicit placeholders—no Inventory or other Milestone 3 behavior is introduced.

`DocumentSheetV2` inherits Application V2 rendering and `detachWindow()`. All handlers operate on event/form arguments and Documents, never a global `document.querySelector`, so the same form, tabs, rolls, and updates work in the detached document. Actor and embedded-Item hooks remain registered and UUID-filtered because automatic coverage of every embedded update is not assumed; they are removed on close.

## M3 final transfer compatibility boundary

PF2e Core's creature trade negotiation uses the source-private `TradeDialog` application and `TradeDialog.canTrade(...)`; it has no stable external runtime entry point. **Creature-to-creature trade negotiation is currently intentionally more restrictive than PF2e Core because the Core trade application is not exposed as a stable external runtime API.** The controller blocks the unsafe non-GM fallback and directs the user to the official sheet.

The same compatibility rule applies to credits: PF2e deliberately keeps `transferCredits` out of its callable API. The module recognizes Core credsticks exactly as treasure items with `system.category === "credstick"` and safely blocks them before `transferItemToActor`. Its own `DialogV2` receives rendered HTML as a string and reads submission data from the clicked button's nearest form, so opening it from a detached sheet does not require the main-window global `document`.
