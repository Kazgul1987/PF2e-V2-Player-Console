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

## Milestone 3 inventory map

The inventory client uses runtime Documents only; source-only helpers (`sizeItemForActor`, `isContainerCycle`, `UpdateCurrencyDialog`, `IdentifyItemPopup`, and PF2e sheet classes) are **not imported**. PF2e therefore remains responsible for validation, derived data, stacking, bulk, investment, consumption, and transfers.

| Feature | Core template | Core handler | Runtime / Document API | External-module-safe? | PF2e-specific behavior |
|---|---|---|---|---:|---|
| Inventory preparation | `static/templates/actors/partials/inventory.hbs` | `actor/sheet/base.ts:prepareInventory` | `actor.inventory.contents`, `.bulk`, `.invested` | yes | Seven core sections; roots exclude `isInContainer` |
| Inventory grouping | same; `item-line.hbs` | `prepareInventoryItem` | physical `type`, `sort`, `container`, container `contents` | yes | Weapons and shields share a section; nested contents retain sort |
| Item sheet open/edit | `item-line.hbs` | base `edit-item` | `item.sheet.render(true)` | yes | Unidentified display is already prepared by PF2e |
| Item delete | `item-line.hbs` | base `deleteItem` | `item.deleteDialog()`; modifier bypass `item.delete()` | yes | Container deletion/ejection is handled in Item document lifecycle |
| Item create | inventory section plus | base `#onClickCreateItem` | `actor.createEmbeddedDocuments("Item", sources)` | yes | Shield is skipped in the combined weapon section exactly as core |
| Quantity update | `item-line.hbs` | base increase/decrease handlers | `item.update({"system.quantity": n})` | yes | Shift=5, Ctrl=10; Document schema/pre-update owns coercion |
| Uses update | `item-line.hbs` | physical Item sheet/data | `item.update({"system.uses.value": n})` | yes | Consumable `_preUpdate` clamps and honors auto-destroy minimum |
| Carry type / equipped | `carry-type.hbs` | creature `#openCarryTypeMenu` | `actor.changeCarryType(item,{carryType,handsHeld,inSlot})` | yes | Values are `held`, `worn`, `stowed`, `dropped`, `attached`; attachment UI remains pending |
| Invested | `item-line.hbs` | character `toggle-invested` | `actor.toggleInvested(itemId)` | yes | Actor enforces prepared investment eligibility/limits |
| Container assignment | nested `item-line.hbs` | base sortable drop | `actor.stowOrUnstow(item, container)` | yes | Chooses worn/stowed from `container.stowsItems` and rejects cycles |
| Container open/close | `item-line.hbs` | base `toggle-container` | `item.update({"system.collapsed": ...})` | yes | Core persists `system.collapsed`; V2 follows rather than inventing state |
| Sorting | inventory lists | base `#onDropInventoryItem`; creature `_onSortItem` | `item.sortRelative`; `actor.updateEmbeddedDocuments` | yes | V2 uses Document sorting after container assignment; stack merge parity pending |
| Actor/internal drop | inventory lists | base `_onDropItem`; sortable | `Item.implementation.fromDropData`, `stowOrUnstow`, `sortRelative` | yes | Same-Actor drops move; source data comes from Foundry parser |
| Item/other-Actor drop | inventory lists | base `_onDropItem`, `moveItemBetweenActors` | `sourceActor.transferItemToActor(target,item,quantity,containerId)` | yes | PF2e decides permission/socket and move semantics |
| Compendium/world drop | inventory lists | base `_handleDroppedItem` | `Item.implementation.fromDropData`; `actor.inventory.add` | yes | Copies and stacks through ActorInventory; core size-adjust helper is internal and remains pending |
| Bulk | inventory header/rows | `prepareInventory` | `actor.inventory.bulk`, `item.bulk` | yes | Never calculated by this module; includes container reduction/size |
| Coins | character inventory footer | base add/remove handlers | `actor.inventory.currency`, `.addCoins`, `.removeCoins` | yes | Explicit denominations only; PF2e performs all value handling |
| Identification | `item-line.hbs` | base `toggle-identified` | prepared `item.name`, `item.isIdentified`; Item sheet | partial | Core identify/mystify popup is internal and GM-only, so no V2 mutation control |
| Consumables | `item-line.hbs` | creature `consume-item` | `consumable.consume()`, `system.uses` | yes | PF2e owns chat, casting capability, charges, quantity, and auto-destroy |
| Shields | `item-line.hbs` | prepared physical item | `system.hp`, `hardness`, `isBroken`, `isDestroyed`, carry API | yes | Raise Shield is an Actions milestone concern; no shield math is copied |
| Item summary/chat | `item-summary.hbs`, `item-summary-renderer.ts` | `toggle-summary`, `item-to-chat` | internal renderer; `item.toMessage()` | partial | Inline summary/context actions remain a declared parity gap |

### Drag/drop and detached boundary

`TextEditor.getDragEventData(event)` and `Item.implementation.fromDropData(data)` are Foundry V14 runtime entry points; no JSON shape is inferred. `item.toDragData()` produces the outgoing payload. Listeners are scoped to `this.element` and renewed with an `AbortController`, so there is no main-window `document` lookup. Cross-browser-window transfer of native `DataTransfer` is browser/platform dependent and cannot be established statically. Main-window → detached compendium/world/Actor drops and detached internal sorting/container moves require M3-INV-09. There is no alternate PF2e public cross-window transport API in the reference; the safe fallback is opening the source and destination in the same browser window, not shared global DOM state.
