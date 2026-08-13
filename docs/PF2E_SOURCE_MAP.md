# PF2e and Foundry V14 source map

## Baseline and boundary

The read-only PF2e reference is commit `73c870286aeba87c25ccc0258028afedfc888d05` (8.4.0 / Foundry V14). No `@actor`, `@system`, `@module`, or `@util` source alias is imported. Runtime Documents and Statistics are the integration boundary.

## Generic Statistic roll

- **Core UI/action:** `reference/pf2e/static/templates/actors/character/` statistic elements use `data-action="roll-check"` and `data-statistic`.
- **Core handler:** `reference/pf2e/src/module/actor/sheet/base.ts` (`roll-check`, around lines 688–694).
- **Core event source:** `reference/pf2e/src/module/sheet/helpers.ts` (`eventToRollParams`, around lines 140–149).
- **Runtime API:** `actor.getStatistic(slug)?.roll(params)`.
- **Semantics:** `!game.user.settings.showCheckDialogs` is `skipDefault`; Shift flips it. Ctrl or Meta sets `messageMode` to `gm` for a GM and `blind` otherwise. The helper is internal, so the controller mirrors this small public-parameter mapping rather than importing it.

Saves and skills use the same path. Rows and slugs come from prepared Actor data, and PF2e owns modifiers, options, dialog, check evaluation, and chat cards.

## Perception

- **Core UI:** `reference/pf2e/static/templates/actors/character/partials/sidebar.hbs` includes normal and `data-secret` perception controls (around lines 215–235).
- **Core handler:** `reference/pf2e/src/module/actor/creature/sheet.ts` (`perception-check`, around lines 152–155).
- **Special case:** a truthy `anchor.dataset.secret` adds `extraRollOptions: ["secret"]`.
- **Runtime API:** the module resolves `getStatistic("perception")` and calls `roll`; its secret button supplies the same extra option.

## Actor name edit and V14 form path

The core name control is `reference/pf2e/static/templates/actors/character/partials/header.hbs` and ultimately updates the Actor Document. Foundry's exact V2 form contract is declared in `reference/pf2e/types/foundry/client/applications/_types.d.mts`: `ApplicationFormSubmission(event, form, FormDataExtended)`. `application.d.mts` defines `_onSubmitForm`; `document-sheet.d.mts` defines document-sheet submit processing. A real top-level form is configured through `DEFAULT_OPTIONS.form`; the narrow handler validates `formData.object.name` and calls `document.update({ name })`.

## Permissions

`reference/pf2e/types/foundry/client/applications/api/document-sheet.d.mts` defines `document`, `isVisible`, `isEditable`, and configured view/edit thresholds. Editable markup uses `isEditable`; the update handler also requires `document.canUserModify(game.user, "update")`. This yields Foundry document-sheet visibility for Limited/Observer users and owner-only editing in this slice.

## Sheet base and registration

Foundry V14 exposes `DocumentSheetV2` from `foundry.applications.api`; its declaration shows that it extends `ApplicationV2`. `HandlebarsApplicationMixin(DocumentSheetV2)` therefore retains PARTS, TABS, actions, rendering, and inherited `detachWindow()` while adding document binding/forms/permissions/lifecycle. The Actor-sheet registration contract is `foundry.documents.collections.Actors.registerSheet`, demonstrated by PF2e at `reference/pf2e/src/scripts/register-sheets.ts` (around lines 45–70) and typed in `world-collection.d.mts`. The module is architecturally registration-ready but does not replace/register as default during this incomplete milestone.

## Localization

Stable core labels reused by templates include `PF2E.PerceptionHeader`, `PF2E.SavesHeader`, `PF2E.SkillsLabel`, `PF2E.LevelLabel`, and `PF2E.Check.Specific.Perception.Secret`, verified in PF2e's `static/lang/en.json` and core templates. Module-specific actions, placeholders, tabs, and errors use `PF2E_V2_PLAYER_CONSOLE.*` from `lang/en.json` and `lang/de.json`; no PF2e keys are guessed.
