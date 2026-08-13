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

### Actor-to-Actor transfer path (re-audited before the M3 fixup)

The V14 core path is `_onDropItem` → `moveItemBetweenActors` in
`src/module/actor/sheet/base.ts`.  The sheet first calls its private
`#attemptTrade`; that helper is **internal-only** and cannot be invoked by a
module.  Ordinary/merchant moves then use the likewise non-exported
`ItemTransferDialog` (`actor/sheet/popups/item-transfer-dialog.ts`) to select
`quantity`, `newStack`, and `move`/`purchase`/`credits`, and finally call the
runtime method `sourceActor.transferItemToActor(target, item, quantity,
containerId, newStack, isPurchase)`.  That public Document method clamps the
quantity, checks both permissions (or requests the GM socket transfer for
lootable actors), exchanges merchant coins, updates/deletes the source, and
creates or stacks the target through PF2e's grouped update.  Consequently the
module may reproduce only the selection UI and must leave every transfer rule
to `transferItemToActor`. Creature-to-creature trade negotiation and credstick
credit transfer depend on private/source-only helpers and remain explicit
limitations rather than being silently bypassed.

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
| Item/other-Actor drop | inventory lists | base `_onDropItem`, `moveItemBetweenActors` | `sourceActor.transferItemToActor(target,item,quantity,containerId,newStack,isPurchase)` | yes | Module DialogV2 selects quantity/stack/purchase; PF2e decides permission/socket, source update/delete, target stack/create, and coin exchange |
| Compendium/world drop | inventory lists | base `_handleDroppedItem` | `Item.implementation.fromDropData`; `actor.inventory.add` | yes | Copies and stacks through ActorInventory; core size-adjust helper is internal and remains pending |
| Bulk | inventory header/rows | `prepareInventory` | `actor.inventory.bulk`, `item.bulk` | yes | Never calculated by this module; includes container reduction/size |
| Coins | character inventory footer | base add/remove handlers | `actor.inventory.currency`, `.addCoins`, `.removeCoins` | yes | Explicit denominations only; PF2e performs all value handling |
| Identification | `item-line.hbs` | base `toggle-identified` | `item.setIdentificationStatus` | partial | V2 exposes GM/editable identify/mystify; core's source-only `IdentifyItemPopup` status selection remains unavailable |
| Consumables | `item-line.hbs` | creature `consume-item` | `consumable.consume()`, `system.uses` | yes | PF2e owns chat, casting capability, charges, quantity, and auto-destroy |
| Shields | `item-line.hbs` | prepared physical item | `system.hp`, `hardness`, `isBroken`, `isDestroyed`, carry API | yes | Raise Shield is an Actions milestone concern; no shield math is copied |
| Item summary/chat | `item-summary.hbs`, `item-summary-renderer.ts` | `toggle-summary`, `item-to-chat` | internal renderer; `TextEditor.enrichHTML`; `item.toMessage()` | partial | V2 renders a local enriched description and delegates chat; core renderer's additional actions remain a declared gap |

### Carry, summary, identification, and currency boundaries

- **Carry:** Core's `carry-type.hbs` conditions `attached` on `isAttachable`,
  worn-in-slot on `usage.type/where`, implanted on implanted usage, and stowed
  on a stowing container. The module prepares those same conditions and calls
  `actor.changeCarryType`; attached intentionally enters PF2e's runtime
  `ItemAttacher`, while `inSlot` is passed to the public method.
- **Summary:** `ItemSummaryRenderer` is source-internal. The module therefore
  enriches only the prepared item description via Foundry `TextEditor` and
  scopes the disclosure to the row under this Application's `element`; it does
  not clone core summary actions or query the main global document.
- **Chat:** `item.toMessage(event)` is a stable runtime Document method and is
  used directly, so PF2e owns identification visibility and card rendering.
- **Identification:** `IdentifyItemPopup` is a private deep source import, but
  `item.setIdentificationStatus` is runtime-reachable. Direct GM-only
  identified/unidentified controls use that method; the richer popup remains
  pending.
- **Currency:** Core `UpdateCurrencyDialog` and distribution dialogs are
  internal UI. `actor.inventory.addCoins/removeCoins` are runtime APIs and back
  the module's PP/GP/SP/CP controls. By-value coin breaking, distribution,
  withdrawal, and treasure-sale UI remain pending and are not described as
  complete.

### Trade and merchant limitation

Merchant→character uses the public transfer API with `isPurchase=true`; PF2e
calculates price, removes buyer coins, credits the merchant, and aborts on
insufficient funds. Core's `#attemptTrade` and trade Svelte application are not
public. A non-GM creature-to-creature case that core would negotiate is
therefore stopped with a localized official-sheet fallback. Credstick
`transferCredits` is likewise internal. These cases are never converted into
an unpriced/unconfirmed ordinary move.

### Drag/drop and detached boundary

`TextEditor.getDragEventData(event)` and `Item.implementation.fromDropData(data)` are Foundry V14 runtime entry points; no JSON shape is inferred. `item.toDragData()` produces the outgoing payload. Listeners are scoped to `this.element` and renewed with an `AbortController`, so there is no main-window `document` lookup. Cross-browser-window transfer of native `DataTransfer` is browser/platform dependent and cannot be established statically. Main-window → detached compendium/world/Actor drops and detached internal sorting/container moves require M3-INV-09. There is no alternate PF2e public cross-window transport API in the reference; the safe fallback is opening the source and destination in the same browser window, not shared global DOM state.
