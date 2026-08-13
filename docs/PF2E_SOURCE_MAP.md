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

## M3 final audit: credits, merchant modes, carry values, and DialogV2

### Credstick

- **Core detection:** `ItemTransferDialog.wait` in `src/module/actor/sheet/popups/item-transfer-dialog.ts` detects `item.isOfType("treasure") && item.system.category === "credstick"`. `TreasurePF2e.isMoney` and physical stacking use the same category semantics; the transfer path does not detect a credstick from an invented flag.
- **Core mode:** detection forces dialog mode `credits`; the quantity is the Item price's credit value. In `moveItemBetweenActors`, transferring all credits from a non-basic credstick (`system.slug !== "credstick"`) is converted back to an Item move, while other credit selections call `transferCredits`.
- **Core mutation and rules:** `src/module/item/physical/helpers.ts:transferCredits` clamps to the available price credits, uses `targetActor.inventory.addCurrency({credits})`, and reduces `system.price.value`. Its loot permission rule requests the internal `ItemTransfer` GM-socket workflow when both ends are owner/loot-accessible but not both owned. The socket enactment repeats loot-access sanity checks.
- **External accessibility:** the helper's own comment says it is separated specifically to avoid making it callable API during the first versions. It is a source export through the internal `@item/physical/helpers.ts` alias, not a stable runtime property on `game.pf2e`, ActorInventory, or the Item Document. `ItemTransfer` and `ItemTransferDialog` are likewise bundled source classes, not supported module APIs.
- **Module behavior:** the module checks the exact Core treasure/category condition before trade, dialog, or `transferItemToActor`, shows a localized warning, and returns. Credit transfer is therefore pending/safely blocked: a credstick can never accidentally take the ordinary physical transfer path.

### Merchant purchase and gift/move

`moveItemBetweenActors` selects `purchase` exactly when the source is a loot Actor with `isMerchant`; it rejects a non-empty backpack. Core's `ItemTransferDialog` always offers Purchase and additionally offers its Gift button (action `move`) only when `item.isOwner`. The module mirrors those conditions and rechecks ownership in the controller before permitting `purchase:false`. Purchase and move both delegate to `sourceActor.transferItemToActor`; only the boolean differs, so PF2e alone calculates price, removes/adds coins, checks permissions/GM-socket loot access, changes quantities, and creates or stacks the target.

Core uses the concrete `item.isOfType("ammo")` condition—not a trait or broad consumable heuristic—to default purchase quantity to `Math.min(10, item.quantity)`; other purchases default to 1. Both dialogs expose `newStack` only when `recipient.inventory.findStackableItem(item._source,{containerId})` found a stack, then pass the selection to `transferItemToActor`.

**Creature-to-creature trade negotiation is currently intentionally more restrictive than PF2e Core because the Core trade application is not exposed as a stable external runtime API.** Core's source-private `#attemptTrade` combines GM/lootability, active recipient-owner user selection, `TradeDialog.canTrade`, optional reach enforcement, and a trade request. The module cannot safely reconstruct or call that application and retains its conservative official-sheet fallback.

### Carry types

PF2e's internal `ITEM_CARRY_TYPES` tuple in `src/module/item/base/data/values.ts` is `attached`, `dropped`, `held`, `implanted`, `installed`, `stowed`, and `worn`. No equivalent stable `CONFIG.PF2E` tuple is exposed, so the module keeps one documented compatibility constant in `src/constants.js`; the controller uses that single source.

| Value | Core/manual behavior | Module behavior |
|---|---|---|
| `held` | Manual one- and two-hand actions | Same actions and `handsHeld` |
| `worn` | Manual generic worn action | Same |
| `stowed` | Manual only when a stowing container exists | Same; PF2e selects the container |
| `dropped` | Manual | Same |
| `attached` | Manual only for `item.isAttachable`; `changeCarryType` opens `ItemAttacher` | Same condition and runtime delegation |
| `implanted` | Manual only when `system.usage.type === "implanted"` | Same condition |
| `installed` | Parsed from `installed-in-*` usage; equipment upgrades and parent-item equip state use it, but Core `carry-type.hbs` presents **no manual installed choice** | Accepted internally/displayed from prepared Item state, but deliberately no manual button |
| `inSlot` | Not a carry-type enum value; boolean argument used only for worn usage with `where` | Same conditional worn action and boolean argument |

Thus enum acceptance and UI affordances remain separate: recognizing `installed` does not invent a user action that Core omits.

### Transfer dialogs and detached windows

Core's `ItemTransferDialog` is an internal `DialogV2` subclass and not reusable by an external module. The module therefore owns only the quantity/mode/new-stack selection UI and calls stable Document APIs for mutation. It passes `DialogV2.wait` an HTML **string**, rather than creating content through global `document.createElement`. Its callback starts from the callback-provided button, calls `button.closest("form")`, and constructs `FormDataExtended` from that local form. Quantity, new-stack, Purchase, Gift/Move, and Cancel therefore do not query the main-window DOM. Actual detached-window correctness and native cross-window `DataTransfer` still require M3-FINAL-05 in Foundry V14.

## Milestone 4 Actions and Strikes source map

### Prepared runtime contract and integration boundary

The character Document prepares strikes in `reference/pf2e/src/module/actor/character/document.ts` (`prepareStrike`, attack variants, and damage functions). The supported runtime boundary used by this module is the already-prepared `actor.system.actions` array. Each entry supplies `item`, `slug`, `label`, `ready`, `visible`, `handsAvailable`, `variants[].label/roll`, `damage`, `critical`, `traits`, `weaponTraits`, `ammunition`, `auxiliaryActions`, and `altUsages`. The module retains Core's action index because Core itself resolves `data-action-index` with `actor.system.actions.at(index)` in `actor/sheet/base.ts:getAttackActionFromDOM`; an alternate-usage index is resolved against that entry's prepared `altUsages`. It never reconstructs a strike from inventory and never calculates modifiers, MAP, damage, range, or traits.

| Feature | Core template | Core handler | Runtime API | External-module-safe? | Internal helper / special notes |
|---|---|---|---|---:|---|
| Strike preparation | `static/templates/actors/character/tabs/actions.hbs`, `partials/strike.hbs` | `actor/character/document.ts:prepareStrike` | prepared `actor.system.actions` | yes | `prepareStrike` is private; consume prepared objects only |
| Strike attack | `character/partials/strike.hbs` | `actor/sheet/base.ts` strike listener | `strike.variants[index].roll({event})` | yes | PF2e receives the native event and owns dialog, targets, options, ammo consumption, and chat |
| MAP | `character/partials/strike.hbs` iterates `variants` | same strike listener | prepared `variants[].label` and `.roll` | yes | No local -5/-10 or agile branch; all three labels/functions are PF2e outputs |
| Strike damage | same | base strike damage listener | `strike.damage({event})` | yes | `DamageContext` and `createDamageRollFunctions` remain Core-owned |
| Critical damage | same | base strike critical listener | `strike.critical({event})` | yes | Fatal, deadly, runes, specialization, splash, persistent and additional dice remain Core-owned |
| Alternate / versatile damage | same toggle block | character `toggle-weapon-trait` | `weapon.system.traits.toggles.update({trait:"versatile",selected})`, then prepared damage | yes | Validation helper is internal; only options already prepared by PF2e are rendered |
| Strike traits | strike summary | preparation in character Document | prepared `traits`, `weaponTraits`, reload/range Item data | yes | Labels/descriptions originate in PF2e configuration/preparation |
| Ammo display/link | strike ammo block | character change handler | prepared `ammunition.compatible/selected`; `weapon.update({"system.selectedAmmoId":...})` | yes | Compatibility comes exclusively from PF2e preparation |
| Magazine ammo/reload | strike ammo block | `select-ammo`, `unload`, `reload` | prepared loaded/remaining display | partial | Mutation/reload uses internal `WeaponReloader` plus source-only ordering logic; V2 displays it but does not deep-import the application |
| Reload | strike ammo block | character `reload` | auxiliary `execute` when PF2e supplies one | partial | Core's dedicated `WeaponReloader` is not exposed through `game.pf2e`; no replacement reload rules are invented |
| Auxiliary actions | strike partial | character auxiliary listener | `strike.auxiliaryActions[index].execute({selection})` | yes | Runtime creates Draw, Grip, Release, modular, shield and other choices dynamically |
| Weapon usage/hands | strike partial ready/alt usage blocks | `getAttackActionFromDOM` | prepared `ready`, `handsAvailable`, `altUsages` and auxiliary execution | yes | Covers thrown/melee/natural strikes without requiring a Weapon class check |
| Rule Element toggles | `actors/partials/toggles.hbs` | base toggle change listener | `actor.synthetics.toggles`; `actor.toggleRollOption(domain,option,itemId,checked,suboption)` | yes | Grouping in base `getData`; module filters the prepared `placement === "actions"` entries only |
| Action item grouping | `character/tabs/actions.hbs`, `actors/partials/action.hbs` | `character/sheet.ts:#prepareAbilities` | prepared Item fields, `actionCost`, traits, `actor.system.exploration` | yes | The private `createAbilityViewData` is mirrored only as presentation; no classification by name |
| Action item use/roll | action partial | base `use-action` | `game.pf2e.actions[item.slug]({event,actors:[actor]})` when registered; safe `item.toMessage(event)` fallback | partial | Core's `createUseActionMessage` is internal; fallback creates the PF2e Item chat card rather than inventing a roll |
| Action item open | action partial | base `edit-item` | `item.sheet.render(true)` | yes | Works from the clicked Application, without a global DOM query |
| Action item chat | action partial | base `item-to-chat` | `item.toMessage(event)` | yes | PF2e owns the card and visibility |
| Exploration actions | actions tab exploration panel | `toggle-exploration`, `clear-exploration` | `actor.update({"system.exploration": ids})` | yes | Active/other grouping follows trait and prepared ID list; party assignment UI is not reproduced |
| Downtime actions | actions tab downtime panel | common item handlers | prepared `downtime` trait and Item runtime APIs | yes | Display/open/chat/use supported |
| Reaction/free action | encounter sections | common item handlers | prepared `actionCost.type` | yes | Grouping matches Core's `reaction`/`free` keys |
| Elemental Blast | `character/tabs/actions.hbs`, `partials/elemental-blast.hbs` | `character/sheet.ts:#activateElementalBlastListeners` | none exposed | no | `ElementalBlast` is a source-internal class constructed by the Core sheet; safely omitted and documented, while the canonical kineticist item is not duplicated as an ordinary action |

### Event, permission, and detached semantics

Attack/damage methods receive the original Application-V2 click event exactly as Core does. PF2e therefore interprets Shift/Ctrl/Meta, `showCheckDialogs`, roll mode, targeting, and callbacks in its own Check/Damage code; the generic statistic controller is not involved. Rolls are not pre-emptively owner-gated: the prepared PF2e method remains responsible for whether a user may roll. Document mutations (ammo link, auxiliary action, trait selection, exploration, and roll-option toggles) separately require `actor.canUserModify(game.user,"update")`.

All lookups start from the action target's closest row or from the Application's own `this.element`. No selector reaches into global `document`, so strike, action summary, ammo select, and toggle handlers remain structurally safe after `detachWindow()`. Actor/item lifecycle hooks already re-render this sheet for equipment, ammunition, rule, condition, and embedded Item changes. Combat-only synthetic changes that do not emit an Actor/Item update still require Foundry runtime verification.
