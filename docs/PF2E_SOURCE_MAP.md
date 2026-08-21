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

## Actor name edit

The core name control is `reference/pf2e/static/templates/actors/character/partials/header.hbs` and ultimately updates the Actor Document. This module intentionally has no top-level form or global Save/Submit lifecycle: its focused input trims and validates on blur, Enter uses that same path, Escape restores the Document value, and the mutation is a targeted `document.update({ name })`.

## Permissions

`reference/pf2e/types/foundry/client/applications/api/document-sheet.d.mts` defines `document`, `isVisible`, `isEditable`, and configured view/edit thresholds. Editable markup uses `isEditable`; the update handler also requires `document.canUserModify(game.user, "update")`. This yields Foundry document-sheet visibility for Limited/Observer users and owner-only editing in this slice.

## Sheet base and registration

Foundry V14 exposes `DocumentSheetV2` from `foundry.applications.api`; its declaration shows that it extends `ApplicationV2`. `HandlebarsApplicationMixin(DocumentSheetV2)` therefore retains PARTS, TABS, actions, rendering, and inherited `detachWindow()` while adding document binding/forms/permissions/lifecycle. The Actor-sheet registration contract is `foundry.documents.collections.Actors.registerSheet`, demonstrated by PF2e at `reference/pf2e/src/scripts/register-sheets.ts` (around lines 45–70) and typed in `world-collection.d.mts`. The module is architecturally registration-ready but does not replace/register as default during this incomplete milestone.

### Tab listener roots

Application V2 navigation buttons and content panels intentionally share `data-group="primary"` and their `data-tab` value. Runtime listeners therefore bind through the application element to `.tab-panel[data-group="primary"][data-tab="..."]`, never a bare `[data-tab="..."]` selector that could resolve to the navigation button. This is a module event-binding constraint rather than a PF2e rule.

## Localization

Stable core labels reused by templates include `PF2E.PerceptionHeader`, `PF2E.SavesHeader`, `PF2E.SkillsLabel`, `PF2E.LevelLabel`, and `PF2E.Check.Specific.Perception.Secret`, verified in PF2e's `static/lang/en.json` and core templates. Module-specific actions, placeholders, tabs, and errors use `PF2E_V2_PLAYER_CONSOLE.*` from `lang/en.json` and `lang/de.json`; no PF2e keys are guessed.

## M14.3 Character deity and experience

- **Deity preparation:** `reference/pf2e/src/module/item/deity/document.ts:36-53` assigns the embedded Deity document to `actor.deity` and prepares `system.details.deities`. `reference/pf2e/src/module/actor/character/document.ts:310-323` resets that prepared reference/data before item preparation.
- **Current Core sheet deity call-site:** `reference/pf2e/src/module/actor/character/sheet.ts:185` assigns `sheetData.deity = actor.deity`; `reference/pf2e/static/templates/actors/character/tabs/character.hbs:39-41` renders that prepared document. The module therefore uses `actor.deity?.name` rather than searching embedded Items or resolving slugs.
- **XP contract and preparation:** `reference/pf2e/src/module/actor/character/data.ts:128-138` declares prepared `value`, `min`, `max`, and computed `pct`. `reference/pf2e/src/module/actor/character/document.ts:491-496` prepares `pct` from the current Core values.
- **Current Core sheet XP call-site:** `reference/pf2e/static/templates/actors/character/partials/header.hbs:35-42` renders `data.details.xp.value`, `max`, and `pct`. The module reads the same `actor.system.details.xp` object and does not assume a maximum value.

## Runtime foundation: Handlebars partials

The complete `src/templates` inventory contains one external partial: `character-sheet/inventory-item.hbs`, referenced recursively by `inventory.hbs`. The `strikeRow` and `actionSection` blocks in `actions.hbs` are template-local `#*inline` partials and therefore require no global registration. `character.hbs` has no partial reference.

`HANDLEBARS_PARTIALS` in `src/constants.js` is the single registration list. Foundry V14 declares `foundry.applications.handlebars.loadTemplates(paths: string[] | Record<string, string>)` in `types/foundry/client/applications/handlebars.d.mts`; an array registers each template under its full path, matching the quoted partial name in `inventory.hbs`. Module init starts one cached preload promise, and `openCharacterSheet` waits for it before rendering. A rejected load is logged with its paths and is not retried or duplicated during the same runtime.

## Runtime foundation: Actor Directory integration

PF2e V14's `ActorDirectoryPF2e._createContextMenus` (`reference/pf2e/src/module/apps/sidebar/actor-directory.ts`) creates the entry menu for `.directory-item[data-entry-id]` with hook name ``get${this.documentName}ContextOptions``—that is, `getActorContextOptions`. The hook receives the directory application and its mutable context-entry array. V14 `ContextMenuEntry` uses `label`, `visible`, and `onClick(event, HTMLElement)`. PF2e's real `visible` and `onClick` call sites resolve `li.dataset.entryId` through `game.actors`; the module does the same and warns to the console when resolution fails. `CharacterAdapter.supports` keeps the entry restricted to PF2e Characters.

## Release tooling

The canonical repository, update manifest, and archive use GitHub's versionless release-asset convention: `manifest.url`, `${manifest.url}/releases/latest/download/module.json`, and `${manifest.url}/releases/latest/download/${manifest.id}.zip`. `scripts/validate.mjs` enforces this relationship without a version or `raw.githubusercontent.com`; `scripts/prepare-release.mjs` updates `version` and preserves/reasserts both `latest/download` URLs.

## Runtime foundation: official PF2e sheet integration

PF2e 8.4's Character sheet still derives from Foundry's legacy `ActorSheet`, whose documented `_getHeaderButtons` pipeline fires `getApplicationHeaderButtons`. The module uses that public hook, filters by `CharacterAdapter.supports(application.actor)`, and adds the localized V2 launcher control. It does not inject DOM or call private PF2e sheet methods. This compatibility control can be removed when PF2e migrates its official sheet and publishes an equivalent V2 control hook; the Directory and direct API launchers remain independent.

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
| Item summary/chat | `item/base/document.ts#getDescription`, `item-summary.hbs`, `item-summary-renderer.ts` | `toggle-summary`, `item-to-chat` | public Item description runtime API; `item.toMessage()` | partial | Shared helper delegates descriptions to Core (including alterations/addenda/visibility); core renderer's additional actions remain a declared gap |

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

## Milestone 5 Feats source map

PF2e prepares `sheetData.feats = [...actor.feats, actor.feats.bonus]` in `src/module/actor/character/sheet.ts`. `CharacterFeats` in `src/module/actor/character/feats/collection.ts` creates and coordinates the regular groups plus the separate bonus group. `FeatGroup` in `src/module/actor/character/feats/group.ts` assigns Items, exposes localized group/slot data and nested grants, validates categories, and performs the final insertion/update. The module consumes these prepared objects and does not reproduce eligibility or slot rules.

| Function | Core Reference | Runtime API | V2 Implementation |
|---|---|---|---|
| Groups, slots, features | `character/feats/collection.ts`, `group.ts`; `tabs/feats.hbs` | `actor.feats`, `.bonus`, group `feats/slots` | `FeatsAdapter.prepare` preserves runtime-created groups, empty slots and nested grants |
| Name/icon/level/category/traits/cost | feat Item Document; `feat-slot.hbs`; `chat/feat-card.hbs` | prepared Item getters, `system.traits`, `actionCost`, `CONFIG.PF2E` labels; `actionGlyph` helper | Presentation-only row model and template; no name/category/action heuristics |
| Open/chat/delete | actor base Item handlers | `item.sheet.render(true)`, `item.toMessage(event)`, `deleteDialog`/`delete` | `FeatController`; PF2e Document lifecycle owns grant handling |
| Summary | `item/base/document.ts#getDescription`; internal `item-summary-renderer.ts` | `item.getDescription({ secrets: item.isOwner })` | shared inventory/action summary pattern, row-local target |
| Create | no stable public blank-Feat flow verified | — | intentionally pending; no artificial `category: "bonus"` Item is created |
| External drop flow | `character/sheet.ts:_onDropItem`; `collection.ts:CharacterFeats.insertFeat` | `Item.implementation.fromDropData`, `actor.feats.insertFeat(item, slotData)` | compendium/world/other-Actor Feats are resolved as Documents and delegated to the collection; other Item types are ignored |
| Internal group/slot move | `character/sheet.ts:_onSortItem` (lines 1542–1552); `collection.ts:CharacterFeats.insertFeat` | `actor.feats.insertFeat(item, {groupId,slotId})` | existing same-Actor Feats are updated without copying; an internal same-Actor drop whose target group is slotted and whose `slotId` is missing is a silent no-op before insertion, matching Core; otherwise the collection chooses validity, fallback, slot, or rejection |
| Final insertion and slot updates | `character/feats/group.ts:FeatGroup.insertFeat` | called by `CharacterFeats.insertFeat` | not called directly by this module; Core creates external Items or updates existing locations and handles occupied slots |
| Bonus group handling | `collection.ts:insertFeat/#findBestLocation`; `group.ts:insertFeat` | `actor.feats.bonus`, target `groupId: "bonus"` | bonus is a target group; Core sets `system.location`; it is never synthesized as `system.category` |
| Free-group sorting | `character/sheet.ts:_onSortItem`; Foundry sortable Item handler | `item.sortRelative({target,siblings})` | same-Actor, same unslotted group only; cross-group and slotted moves use collection insertion |
| Granted children | `group.ts:#getChildSlots`; Item `grantedBy`/`grants` preparation | prepared `children`, `item.grantedBy` | rendered recursively but not exposed as independent drag sources; grant flags are never mutated locally |
| Permissions/detached/live | DocumentSheet and existing hooks | `canUserModify`, Application element, Actor/Item hooks | mutations guarded; listeners and summaries scoped to `this.element`/event targets; existing hooks rerender |

`CharacterFeats.insertFeat` first checks whether the Item is already embedded, delegates category/fallback and bonus selection, and then calls `FeatGroup.insertFeat`. `FeatGroup.insertFeat` creates a copy only for a new source Item; for an existing Actor Item it updates location and slot data. This is why external drops and internal group/slot moves share the collection API while pure same-group ordering remains a separate `sortRelative` operation.

Core's Character Sheet `_onSortItem` guard at `reference/pf2e/src/module/actor/character/sheet.ts:1549-1550` returns `[]` when `group?.slotted && !featSlot.slotId`. The V2 controller applies that guard only when the resolved Feat already belongs to the same Actor: **internal same-Actor drop + slotted target group + missing `slotId` → no-op**. External Compendium, World Item, and other-Actor drops therefore still reach `CharacterFeats.insertFeat`, which remains responsible for finding a valid location or rejecting the drop.

Search/filter, blank creation, and Compendium Browser launching remain **pending** because Core's browser/create UI is not a stable public workflow. Rich summary actions are **partial** because `ItemSummaryRenderer` is internal. Native cross-window `DataTransfer` remains browser-dependent and requires manual testing.

## Milestone 6 – Spellcasting

| PF2e surface | PF2e source path | Runtime API used by this module | Notes / limitations |
| --- | --- | --- | --- |
| `ActorSpellcasting` | `src/module/actor/spellcasting.ts` | `actor.spellcasting.collections` | Central iterator includes regular, focus, item-backed and ephemeral ritual collections; the adapter does not fall back to `itemTypes.spellcastingEntry`. |
| `SpellcastingEntryPF2e` | `src/module/item/spellcasting-entry/document.ts` | collection `entry`, `entry.statistic` | Supplies category flags, attack statistic and DC; item-entry create/delete UI is intentionally pending. |
| `SpellCollection` | `src/module/item/spellcasting-entry/collection.ts` | collection iteration/get, `addSpell`, `prepareSpell`, `setSlotExpendedState`, `swapSlotPositions` | Owns copy/move, rank validation and prepared-slot updates. No parallel slot model is created. |
| `RitualSpellcasting` | `src/module/item/spellcasting-entry/rituals.ts` | ritual collection `getSheetData`, entry `cast` | Ephemeral section renders; cast delegates to its chat-only core implementation. It is never treated as deletable entry data. |
| Prepared sheet data | `src/module/item/spellcasting-entry/document.ts`, `collection.ts`; `rituals.ts` | parameterless `entry.getSheetData()`, internally `getSpellData()` | The verified regular-entry signature accepts only `{ prepList }`, while the ritual signature accepts no options; the shared parameterless call supports both. Groups, rank labels, active slots, uses, cast ranks and expended flags are only normalized to primitives. |
| Cast and consume | `src/module/item/spellcasting-entry/document.ts` | `entry.cast(spell, { rank, slotId })` | `cast` calls Core `consume`; Core owns prepared/spontaneous slots, innate uses, focus points, at-will behavior, `computeCastRank`, validation, and message creation. |
| Focus resource adjustment | `src/module/actor/creature/sheet.ts`, `document.ts` | `actor.getResource("focus")`, `actor.updateResource("focus", nextValue)` | The official `adjust-resource` click/contextmenu flow adds or subtracts one from the retrieved value. `updateResource` owns resource lookup, validity, and clamping; this module whitelists only `focus` and does not update its source path directly. |
| Focus group counters | `src/module/item/spellcasting-entry/collection.ts`, `static/templates/actors/partials/spell-collection.hbs` | prepared group `id`, `uses` | Core separates Focus cantrips into `id: "cantrips"` without `uses` and renders `∞ / ∞`; non-cantrip Focus Spells receive Focus `uses`. The console preserves that boundary instead of applying Focus pips to cantrips. |
| Add / move | `src/module/item/spellcasting-entry/collection.ts` | `collection.addSpell(spell, { groupId })` | Compendium, world, other-actor and same-actor drops use Core copying/moving and heightening validation. |
| Prepare / unprepare | `src/module/item/spellcasting-entry/collection.ts` | `prepareSpell(spellOrNull, groupId, slotIndex)` | Concrete prepared-slot drops and unprepare never delete the Spell Item. Flexible preparation remains partial because Core presents its management in `SpellPreparationApp`. |
| Expended / prepared swap | `src/module/item/spellcasting-entry/collection.ts`; entry flags in `document.ts` and `rituals.ts` | `setSlotExpendedState(...)`, `swapSlotPositions(...)` | Both mutations are Core-owned. `swapSlotPositions` is used only for classic prepared entries (`isPrepared && !isFlexible`), explicitly never rituals, and only for a same-entry/same-group drag with valid non-negative source/target indices. Flexible, ritual, spontaneous, innate, and focus casting never enter this prepared-slot path. |
| `canCast` | `document.ts`, `rituals.ts`, `item-spellcasting.ts` | indirectly enforced by entry/core flows | No local tradition/focus/cantrip eligibility implementation. |
| `Spell.toMessage` | `src/module/item/spell/document.ts` | `spell.toMessage(event)` for chat-only; indirectly from `entry.cast` | Chat-only is separate from cast, preventing accidental consumption. |
| Spell attack | `document.ts`; `src/system/statistic` | `entry.statistic.check.roll(RollController.eventToRollParams(event))` | Reuses the module's dialog/blind-roll event mapping. DC is display-only from prepared statistic chat data. |
| Item activations | `item-spellcasting.ts`, consumable activation sources | none in spell section | Safe omission: inventory/PF2e activation flows retain charge ownership; no charge logic is recreated here. |

## Milestone 6 addendum – editable spell-slot counts

- **Core model:** `reference/pf2e/src/module/item/spellcasting-entry/data.ts` defines `SpellSlotData` with `value`, `max`, and `prepared` under `system.slots.slot0` through `slot10`.
- **Core preparation/lifecycle:** `reference/pf2e/src/module/item/spellcasting-entry/document.ts` sizes classic prepared arrays to `group.max` during `prepareBaseData`; `_preUpdate` normalizes `max` and clamps `value` to `0...max`; `consume` updates the same slot `value` for spontaneous/flexible casting.
- **Core UI:** `reference/pf2e/static/templates/actors/partials/spell-collection.hbs` exposes group counters only for `group.uses` outside focus pools. Innate uses remain per Spell Item and rituals are virtual.
- **Runtime API:** persistent `SpellcastingEntryPF2e.update({"system.slots.slotN.value|max": integer})`. The module whitelists the terminal field and rank and lets the Document lifecycle perform final validation.

## Milestone 14.2 – prepared-spell parity

The current v14-dev creature sheet opens the source-internal Svelte `SpellPreparationApp` from
`src/module/actor/creature/sheet.ts:#openSpellPreparation` for every prepared entry. The app calls
`entry.getSheetData({ prepList: true })`; its `prepList` is the entry collection's known-spell source.
Classic prepared ranks use concrete slots, while flexible prepared non-cantrips use signature toggles;
only flexible cantrips use concrete preparation slots. Because the app class is not exposed as a public
runtime API, this module uses a small `DialogV2` (an Application V2 surface) for a concrete empty classic
slot and populates it only from that same prepared `prepList`. It does not query `actor.items` or a
Compendium.

| Core operation | Verified current call-site | Module runtime call |
| --- | --- | --- |
| Prepare / unprepare | `src/module/actor/creature/apps/spell-preparation/app.ts:159,167`; actor-sheet concrete-slot paths at `src/module/actor/creature/sheet.ts:207,390` | `collection.prepareSpell(spellOrNull, groupId, slotIndex)` |
| Swap occupied prepared slots | `src/module/actor/creature/sheet.ts:340-360` | `collection.swapSlotPositions(groupId, sourceIndex, targetIndex)` after same-entry/group and concrete-slot validation |
| Add a known spell to a collection | preparation-app drop at `src/module/actor/creature/apps/spell-preparation/app.ts:255`; actor-sheet drops at `src/module/actor/creature/sheet.ts:386,412,464` | `collection.addSpell(item, { groupId })`; Core owns movement/copying and rank validation |
| Expended state | `src/module/actor/creature/sheet.ts:211-222`; casting also calls it from `src/module/item/spellcasting-entry/document.ts:321` | `collection.setSlotExpendedState(groupId, slotIndex, value)` independently of the prepared Spell ID |
| Known-spell picker data | `src/module/actor/creature/apps/spell-preparation/app.ts:88-146` | `entry.getSheetData({ prepList: true }).prepList`, then final resolution through the same `collection` |

Classic controls are gated by prepared sheet flags (`isPrepared === true`, `isFlexible !== true`, and
not ritual). Spontaneous, innate, focus, ritual, and flexible entries receive no classic prepare button,
drop styling, unprepare control, or prepared-slot swap path. Core's `prepareSpell` remains the final
cantrip/rank validator. The module only narrows picker rows using the rank groups already supplied by
`prepList`, matching the eligibility branches in `SpellPreparationApp`; it implements no heightening or
spell-eligibility engine.

## Milestone 7 – Crafting

| Core source | Runtime API | Purpose | Module usage |
| --- | --- | --- | --- |
| `src/module/actor/character/crafting/crafting.ts` | `actor.crafting.getFormulas()`, `.abilities`, `.performDailyCrafting()`, `.resetDailyCrafting()` | Known formulas, ability collection, atomic daily preparation/resource flow | Adapter data and targeted daily controls |
| `src/module/actor/character/crafting/ability.ts` | `ability.getSheetData()` | Prepared formulas, computed batches, capacity and resources | View-model source; no local calculations |
| same | `prepareFormula(uuid)`, `unprepareFormula(index)`, `setFormulaQuantity(index,value)` | Predicate-validated preparation persistence in owning rule elements | D&D prepare and targeted controls |
| same | `craft(index)` | Ability-specific resource/slot consumption and temporary Item creation | Prepared formula Craft action |
| `src/module/system/action-macros/crafting/craft.ts` | `game.pf2e.actions.craft({uuid,quantity,actors,event})` | Official known-formula Craft check/card flow | Known formula Craft action |
| `src/module/actor/character/sheet.ts` and `static/templates/actors/character/tabs/crafting.hbs` | `CraftingFormula` drag payload and ability methods | Official interaction/reference layout | Formula D&D only; sorting/private picker omitted |

### Daily Crafting state and guards

- **`hasDailyCrafting`:** `reference/pf2e/src/module/actor/character/sheet.ts` prepares it from `actor.crafting.abilities.some((ability) => ability.isDailyPrep || ability.isAlchemical)`. The adapter and runtime controller use that same live-ability predicate rather than Actor level, feat names, or other heuristics.
- **`isDailyPrep`:** `reference/pf2e/src/module/actor/character/crafting/ability.ts` initializes the property from prepared crafting-ability data and currently also sets it for alchemical abilities as a compatibility step.
- **Completion state:** `reference/pf2e/src/module/actor/character/sheet.ts` reads `flags.pf2e.dailyCraftingComplete`; `reference/pf2e/static/templates/actors/character/tabs/crafting.hbs` disables Perform when true and Reset when false.
- **Perform:** `reference/pf2e/src/module/actor/character/crafting/crafting.ts` implements `CharacterCrafting.performDailyCrafting()`, filters daily-preparation abilities, validates resources, expends formulas, adds Items, and sets `dailyCraftingComplete`.
- **Reset:** the same `crafting.ts` implements `CharacterCrafting.resetDailyCrafting()`, removing temporary Items, restoring applicable formulas/resources, and clearing `dailyCraftingComplete`. The module only calls this Core method after its presence/state guards; it duplicates none of those mutations.

Quick Alchemy's official handler directly coordinates a flag, reagent update, and internal `craftItem`; it is not exposed as one atomic stable runtime API and remains pending. Advanced/daily alchemy uses `CharacterCrafting.performDailyCrafting()` and is delegated intact. Formula Browser/Picker and rich Core summary renderer are private sheet applications and remain pending/partial respectively.

## Milestone 8 – Proficiencies

The audit target is PF2e 8.4.0 at the pinned V14 reference. The canonical layout and edit affordances are in `static/templates/actors/character/tabs/proficiencies.hbs`; preparation is in `src/module/actor/character/document.ts` and sheet-only normalization in `src/module/actor/character/sheet.ts`. The adapter consumes prepared runtime data only. It does not import Core source or reproduce `createProficiencyModifier`.

| UI area | PF2e source path | Runtime property / API | Editable? | Verified update path / API | Notes |
|---|---|---|---|---|---|
| Perception | `character/document.ts:prepareDerivedData`; `partials/sidebar.hbs` | `actor.perception` / `getStatistic("perception")` | no | none | Core sidebar renders rank as text; rank is class/rule prepared. Modifier and optional DC are Statistic output. |
| Fortitude | `creature/document.ts:prepareSaves`; sidebar | `actor.saves.fortitude` / `getStatistic("fortitude")` | no | none | Prepared Statistic only. |
| Reflex | same | `actor.saves.reflex` / `getStatistic("reflex")` | no | none | Prepared Statistic only. |
| Will | same | `actor.saves.will` / `getStatistic("will")` | no | none | Prepared Statistic only. |
| Skills | `character/tabs/proficiencies.hbs`; `character/data.ts`; `character/document.ts:prepareBaseData` and `prepareSkills` | display: `actor.system.skills.<slug>.rank/value/dc`; roll: `actor.getStatistic(slug)` | yes, owner | `actor.update({"system.skills.<validated-core-slug>.rank": 0..4})` | Core's template iterates `data.skills` and displays prepared `skill.value` and `skill.rank`. The V2 view also consumes that trace (including `dc`). Source `system.skills` is `Partial`, so a missing key means rank 0, not an invalid skill. |
| Lore | same template; `#onChangeAdjustItemStat` | prepared Lore statistic `itemId`; embedded Lore Item | yes, owner | `LoreItem.update({"system.proficient.value": 0..4})` | Never writes `system.skills`; Item sheet opens through `item.sheet.render(true)`. Create/delete/name editing remain omitted from this slice. |
| Class DC | `character/sheet.ts` class-DC preparation; proficiency template | `actor.classDCs`, `actor.classDC`, `system.proficiencies.classDCs` trace data | no | none | All runtime statistics are rendered, primary first. DC and rank are prepared; zero/one/multiple are supported without synthesizing a DC. |
| Weapon proficiency | `character/sheet.ts` martial normalization | `actor.system.proficiencies.attacks`, `CONFIG.PF2E.weaponCategories` | standard: no; persistent custom: yes | custom only: `actor.update({"system.proficiencies.attacks.<validated-slug>.rank":0..4})` | Standard categories are read-only like Core. No attack modifier is calculated. |
| Armor proficiency | same | `actor.system.proficiencies.defenses`, `CONFIG.PF2E.armorCategories` | no | none | Core proficiency tab renders defenses as rank text. AC is never calculated. |
| Martial/custom | `data.ts:MartialProficiency`; `manage-attack-proficiencies.ts` | prepared attack record (`visible`, `custom`, `sameAs`, `definition`, `maxRank`) plus `_source` | partial | rank update only when both prepared and source records are `custom:true` | Invisible and ordinary untrained extra entries are pruned as in Core. Rule/synthetic-only entries cannot pass the source/custom guard. Core's private ManageAttackProficiencies add/remove dialogs are not duplicated; create/delete are pending. |
| Spellcasting proficiency | proficiency template; `actor/spellcasting.ts` | `actor.spellcasting.base` Statistic | display only | none | Core's proficiency summary is one base statistic. Entry mutation remains owned by the Spellcasting tab/Core; attack, DC, modifier and rank are prepared values. |

### Mutation and synthetic boundary

The controller accepts only the explicit categories `skill`, `lore`, and `attack`, integer ranks 0–4, and a conservative slug grammar. Regular skills must be own keys of `CONFIG.PF2E.skills`, Lore must resolve to an embedded Lore Item, and attacks must be a raw persistent `custom:true` entry. No DOM-provided property path is accepted. Core declares the source skill record as `Partial`: `prepareBaseData()` iterates `CONFIG.PF2E.skills` and copies `_source.system.skills.<slug>.rank` (defaulting to 0). After the Foundry update lifecycle, `prepareDerivedData()` calls `prepareSkills()`, which creates each `Statistic`; `Statistic.getTraceData()` then populates prepared `system.skills.<slug>` with `value` (check modifier), `dc`, `totalModifier`, breakdown, and modifiers, while `prepareSkills()` adds the effective `rank`. Core's proficiency template reads those prepared `skill.value` and `skill.rank` fields. The awaited rank listener renders the same fresh trace for display, while a roll resolves the current Statistic through `actor.getStatistic(slug)` and calls its runtime roll API. This separation prevents a captured/stale Statistic from controlling display and preserves PF2e modifiers, predicates, roll options, and synthetics. No manual prepare call, timing workaround, local calculation, or persistent Statistic cache is used; diagnostic comparisons are manual-test-only and no debug logging remains. Lore, martial entries, native tabs, and detached-window-local listeners are unchanged.

## Milestone 9 – Effects / Conditions / Afflictions

Audit target: pinned PF2e V14 development commit `73c870286aeba87c25ccc0258028afedfc888d05`. Paths are relative to `reference/pf2e`.

| Feature | PF2e source path | Runtime object/API | Persistent source | Editable? | Mutation flow | Notes/status |
|---|---|---|---|---|---|---|
| Effect Item | `src/module/item/effect/document.ts` | `actor.itemTypes.effect`, `EffectPF2e` | embedded Item | owner | `item.delete()` / Item sheet | used; rule elements are not inspected |
| Condition | `src/module/actor/conditions.ts`; `item/condition/document.ts` | `actor.conditions.active`, `ConditionPF2e` | embedded Item or prepared in-memory condition | owner unless readonly/locked | Actor condition methods | used; active collection mirrors character sheet |
| valued Condition | `item/condition/document.ts`; `actor/base.ts` | `system.value.isValued`, `value`, `actor.increaseCondition(condition)`, `decreaseCondition(condition)` | condition Item | owner | Core manager updates value and owns zero/removal | used; no slug list |
| locked/overridden Condition | `item/condition/document.ts`; `actor/conditions.ts` | `isLocked`, `readonly`, `active` | references/grants | no in this UI | none | active entries shown; inactive/overridden entries omitted like Core character tab |
| Persistent Damage | `item/condition/document.ts`; effects panel | `system.persistent`, `rollRecovery()` | condition Item | owner | Core Statistic flat check and condition removal | used only for mutable persistent-damage Conditions; no local roll/DC logic |
| Affliction | `item/affliction/document.ts` | `actor.itemTypes.affliction`, `stage`, `maxStage`, `increase()`, `decrease()` | embedded Item | owner | Affliction methods run stage lifecycle | used in V14 dev; Core notes production availability limitation |
| Duration | `item/abstract-effect/document.ts`; `item/effect/document.ts` | `remainingDuration`, `isExpired`, source duration label | Effect Item prepared state | no | Core time/effect tracker | used without local time calculation |
| Temporary Effect | `actor/conditions.ts`; `rules/rule-element/ephemeral-effect.ts` | in-memory conditions may enter `actor.conditions` | none | no | none | readonly view only; synthetic modifiers/effects are not listed |
| Condition Manager | `system/conditions/manager.ts`; `actor/base.ts` | `game.pf2e.ConditionManager` called internally by Actor APIs | canonical condition pack | indirectly | `increaseCondition`/`decreaseCondition` | public object documented; direct manager mutation not used |
| Effect counter | `item/effect/document.ts`; actor sheet partial/listeners | `system.badge.type`, `increase()`, `decrease()` | Effect Item | owner, non-granted/non-expired | Effect document methods | Core owns loop/bounds and decrease end state; non-counters receive no controls |
| Drop handling | `actor/sheet/base.ts#_handleDroppedItem` | `Item.implementation.fromDropData`, Actor condition API, source context/value normalization, clone-to-clear-ID, `createEmbeddedDocuments` | embedded Item | owner | supported Item types only | Effect/Affliction source fields and Rule Elements are preserved; Condition uses its Actor API; granted and unsupported drops are safe no-ops |
| Chat | `item/base/document.ts`; effects panel | `item.toMessage(event)` | none | permission-dependent | Core chat | used |
| Delete | `actor/base.ts`; effect Item document/grant lifecycle | Effect `delete`; condition `decreaseCondition(...,{forceRemove:true})` | embedded Item | owner | Core document lifecycle | used; granted Effects and locked/readonly Conditions have no delete control |

The original character tab is `static/templates/actors/character/tabs/effects.hbs`, its rows are `static/templates/actors/partials/effects.hbs`, and the current Application V2 reference is `src/module/apps/effects-panel.ts`. Both the character tab and effects panel use Core effect increment/decrement; the panel calls `ConditionPF2e.rollRecovery()` for persistent damage. The character tab passes only `actor.conditions.active`, so stored inactive/overridden conditions remain a documented safe omission. The protected actor drop method cannot be invoked externally, but its public-document sequence is mirrored narrowly: resolve, obtain the source, apply drop context/counter value, clone to clear `_id`, and embed. Add Condition UI and the persistent-damage editor remain pending. `EffectPF2e.remainingDuration` is used as prepared output; the module never reads start time, combat round, turn, rule elements, synthetics, or roll options to derive state.

## Milestone 9 final – Spell-origin drop traits

`src/module/actor/sheet/base.ts#_handleDroppedItem` (pinned V14 commit `73c870286aeba87c25ccc0258028afedfc888d05`) resolves `context.origin.item` with `fromUuidSync`, requires an empty Effect/Affliction trait array and a `SpellPF2e`, filters the Spell's traits by membership in runtime `CONFIG.PF2E.effectTraits`, then continues through clone/source creation and `createEmbeddedDocuments`. The module mirrors that exact boundary without a private whitelist.

## Milestone 10 – Biography

Core sources: `src/module/actor/character/data.ts` (`CharacterBiography`), `src/module/actor/character/sheet.ts` (lines 346–360 enrichment and handlers `toggle-bio-visibility`, `add-edict-anathema`, `delete-edict-anathema`), and `static/templates/actors/character/tabs/biography.hbs` (layout, editor targets, and owner-or-visible semantics).

| UI field | PF2e source path | Raw/persisted? | Rich text? | Editable? | Visibility controlled? | Mutation API |
|---|---|---|---|---|---|---|
| Height | `system.details.height.value` | yes | no | owner | appearance | focused `actor.update` |
| Weight | `system.details.weight.value` | yes | no | owner | appearance | focused `actor.update` |
| Appearance | `system.details.biography.appearance` | yes | yes | owner | appearance | whitelisted controller update |
| Backstory | `system.details.biography.backstory` | yes | yes | owner | backstory | whitelisted controller update |
| Birth place | `system.details.biography.birthPlace` | yes | no | owner | backstory | focused `actor.update` |
| Attitude | `system.details.biography.attitude` | yes | no | owner | personality | focused `actor.update` |
| Beliefs | `system.details.biography.beliefs` | yes | no | owner | personality | focused `actor.update` |
| Edicts | `system.details.biography.edicts` | yes, string array | no | owner | personality | copied array + `actor.update` |
| Anathema | `system.details.biography.anathema` | yes, string array | no | owner | personality | copied array + `actor.update` |
| Likes | `system.details.biography.likes` | yes | no | owner | personality | focused `actor.update` |
| Dislikes | `system.details.biography.dislikes` | yes | no | owner | personality | focused `actor.update` |
| Catchphrases | `system.details.biography.catchphrases` | yes | no | owner | personality | focused `actor.update` |
| Campaign notes | `system.details.biography.campaignNotes` | yes | yes | owner | campaign | whitelisted controller update |
| Allies | `system.details.biography.allies` | yes | yes | owner | campaign | whitelisted controller update |
| Enemies | `system.details.biography.enemies` | yes | yes | owner | campaign | whitelisted controller update |
| Organizations | `system.details.biography.organizations` | yes | yes | owner | campaign | whitelisted controller update |
| Section visibility | `system.details.biography.visibility.{appearance,backstory,personality,campaign}` | yes | no | owner | n/a | explicit whitelisted toggle |

The official template uses the legacy `{{editor ... button=true engine="prosemirror"}}` activation path, while its sheet enriches the six HTML fields with `TextEditorPF2e.enrichHTML({rollData, secrets: actor.isOwner, async:true})`. PF2e exposes that implementation as `game.pf2e.TextEditor` in `src/scripts/set-game-pf2e.ts`, so the adapter calls its public runtime namespace with the same options plus `relativeTo: actor`; Foundry V14 `foundry.applications.ux.TextEditor` is the defensive fallback. This covers PF2e `@Check`, `@Damage`, configured syntax, UUID links, inline rolls, and `processUserVisibility`; exact interactive and Owner/Limited behavior remains a manual Foundry comparison.

V14 editing deliberately does **not** use legacy editor-helper activation or the V1 `activateEditor`/`saveEditor` lifecycle. Explicit Application V2 actions create `foundry.applications.elements.HTMLProseMirrorElement` in the selected field's application-local host. This V14 form-associated element wraps `foundry.applications.ux.ProseMirrorEditor.create(target, content, options)`, exposes canonical content through `save()` and `value`, and destroys its internal editor from `disconnectedCallback`. Raw source is fetched from the controller only after an authorized edit action; enriched HTML alone is rendered in view mode. One editor is allowed at a time, document/item hook renders are deferred while it is open, and save/cancel/close disconnect it before persistence or teardown. Owner sees every section; a non-owner receives only visible sections, without raw content or editor hosts in the DOM.

## Milestone 11 – PFS / Organized Play

Audit target: pinned PF2e V14 commit `73c870286aeba87c25ccc0258028afedfc888d05`. The official view is `static/templates/actors/character/tabs/pfs.hbs`; source types, preparation, update sanitation, and browser flow are in `src/module/actor/character/{data.ts,document.ts,sheet.ts}`.

| Feature | PF2e source path | Runtime property/API | Persisted field | Editable? | Module usage |
|---|---|---|---|---|---|
| Player Number | `pfs.hbs`; `document.ts:_preUpdate` | `actor.system.pfs.playerNumber` | `system.pfs.playerNumber` | owner | Focused nullable integer update; UI range 10000–99999 exactly matches the current template. |
| Character Number | same | `actor.system.pfs.characterNumber` | `system.pfs.characterNumber` | owner | Focused nullable integer update; range 2001–9999. |
| Level Bump | `document.ts:prepareDerivedData` | `actor.system.pfs.levelBump` | `system.pfs.levelBump` | owner | Toggles only the boolean. Core adds check/damage modifiers and HP during preparation. |
| Current Faction | `creature/sheet.ts`; `scripts/config/index.ts` | `CONFIG.PF2E.pfsFactions` | `system.pfs.currentFaction` | owner | Runtime-config keys whitelist options and updates; labels are Core localization keys. |
| Reputation | `pfs.hbs`; `data.ts` | `actor.system.pfs.reputation` | `system.pfs.reputation.<validated faction>` | owner | Nullable integer per runtime-configured faction; no rank calculation. |
| School | `data.ts`; `scripts/config/index.ts` | source field/config remain | `system.pfs.school` | safe omission | Current official PFS template and active character-sheet flow do not render or mutate it; legacy UI is not restored. |
| PFS Boons | `document.ts:prepareFeats`; `pfs.hbs` | `actor.pfsBoons` | embedded Feat Items (`category === "pfsboon"`) | display | Adapter consumes the prepared, sorted runtime collection directly. |
| PFS Boon browser | `sheet.ts:#onClickBrowseFeats`; `pfs.hbs` | `game.pf2e.compendiumBrowser.tabs.feat.getFilterData/open` | none | all viewers (discovery) | Category `pfsboon`, maximum level `actor.level`; the official button is outside editable markup, and selection remains Core browser drag/drop discovery. |
| Boon open | `pfs.hbs` generic item action | `item.sheet.render(true)` | none | document permission | Live embedded Item is resolved by ID. |
| Boon chat | same | `item.toMessage(event)` | ChatMessage | normal Item permission | No custom card. |
| Boon delete | same / grant lifecycle | `item.deleteDialog()` or `item.delete()` | embedded Item deletion | owner, non-granted | Runtime permission, type/category, and `grantedBy` guards. |
| Boon D&D | Actor sheet drop conventions | `Item.implementation.fromDropData`; `actor.createEmbeddedDocuments` | embedded Item creation | owner | Only actual Feat `pfsboon`; same-Actor no-op; external source keeps flags/rules and drops `_id`. |

Core's `_preUpdate` accepts a broader player-number source range (1–9,999,999), but its current UI deliberately constrains input to 10000–99999; this module mirrors current sheet parity rather than silently broadening its control. Empty number and reputation inputs persist `null`, never `0`, `NaN`, or an empty string.

### Shared Item-description runtime route

The pinned Core implementation is `src/module/item/base/document.ts#getDescription(htmlOptions = {})`. It lazily applies Actor description alterations, evaluates predicate-based overrides and addenda against Actor/Item roll options, merges Item roll data, and returns already PF2e-enriched `{ value, gm }` HTML; GM notes are empty for non-GMs. Core's own `item-summary-renderer.ts` requests owner secrets when it obtains chat data. The module's `src/pf2e/item-summary.js` therefore calls `item.getDescription({ secrets: item.isOwner })` on every expansion and renders the returned value plus permitted GM notes without caching or persistence. Inventory, actions, feats, spells, crafting formulas, effects/conditions/afflictions, and PFS Boons all use this one helper.

For a non-PF2e-compatible Item lacking `getDescription`, the helper falls back in order to the public `game.pf2e.TextEditor`, Foundry V14's `foundry.applications.ux.TextEditor`, and the legacy global `TextEditor`, with Item roll data, relative UUID context, and owner-secret visibility. This fallback enriches the available prepared/raw description only; it does not attempt to reconstruct PF2e alterations, addenda, predicates, traits, or rule text, and no private system module is imported.

## Milestone 12.1 character dashboard

| Dashboard value | PF2e 8.4 prepared/runtime source | Boundary |
| --- | --- | --- |
| Attributes | `actor.system.abilities.<str|dex|con|int|wis|cha>.mod`, with Core `shortLabel` | Display only; no score conversion or modifier calculation. |
| Attribute Builder | Core `actor/character/sheet.ts` constructs source-private `AttributeBuilder` for `edit-attribute-boosts` | Not present on `game.pf2e` or `CONFIG.PF2E`; V2 opens the official sheet instead of deep-importing it. |
| Speed | `actor.system.movement.speeds.<land|swim|climb|fly|burrow>.value` | Only non-zero prepared movement modes are displayed. |
| Languages | `actor.system.details.languages.value`; labels from `CONFIG.PF2E.languages` | Includes prepared/granted languages; no slug humanization. |
| Language Selector | Core `ActorSheetPF2e#tagSelector("languages")` constructs source-private `LanguageSelector` | No public runtime constructor/action; V2 opens Core and does not mutate `system.details.languages`, protecting granted entries and campaign rarity rules. |
| Held Shield | `actor.heldShield`, correlated with `actor.system.attributes.shield.itemId` | No inventory trait search. |
| Shield values/state | `actor.system.attributes.shield.{hardness,hp,brokenThreshold,raised,broken,destroyed}` | Core's shield preparation owns all values and states; V2 performs no BT, AC, or status calculation. |
| Inventory section labels | The exact localization keys used by `ActorSheetPF2e#prepareInventory()` in `actor/sheet/base.ts` | `InventoryAdapter` localizes those Core-owned section labels once; it does not derive labels from item-type slugs. |

## Milestone 13 – Persistent Sidebar / Core Resources (v14-dev)

| Data/API | PF2e source | Console use |
|---|---|---|
| Hero/Mythic maximum preparation | `reference/pf2e/src/module/actor/character/document.ts` (`prepareBaseData`) | `heroPoints.max === 0` suppresses Hero Points; Mythic Points are deferred |
| Resource lookup/update | `reference/pf2e/src/module/actor/creature/document.ts` (`getResource`, `updateResource`) and character overloads | `hero-points` lookup and update; PF2e clamps core resources |
| Persisted/current HP | `reference/pf2e/src/module/actor/character/data.ts`; `reference/pf2e/src/module/system/statistic/hit-points.ts` | prepared display from `system.attributes.hp`; targeted current-value update at `system.attributes.hp.value` |
| Perception and saves | `reference/pf2e/src/module/actor/character/document.ts` prepared Statistics | display adapter plus `actor.getStatistic(slug).roll()` |
| Initiative | `reference/pf2e/src/module/actor/initiative.ts`; character preparation in `document.ts` | `actor.initiative.statistic` and `actor.initiative.roll()` |
| Held shield | `reference/pf2e/src/module/actor/creature/document.ts` and prepared `system.attributes.shield` | render only when `actor.heldShield` matches prepared `itemId` |
| Dying/Wounded | `reference/pf2e/src/module/actor/creature/document.ts` (`prepareDerivedData`: active `actor.conditions.bySlug` values copied and clamped into attributes) | read-only `actor.system.attributes.{dying,wounded}.{value,max}`; no condition mutation or HP-derived rule |
| Immunities / Weaknesses / Resistances | `reference/pf2e/src/module/actor/base.ts` (`prepareDerivedData`) constructs IWR instances at `actor.system.attributes.{immunities,weaknesses,resistances}` | display-only prepared arrays |
| IWR display formatter | `reference/pf2e/src/module/actor/data/iwr.ts` (`IWR#label` / `#createLabel`) | consume each prepared instance's `label`, preserving localized exceptions and resistance `doubleVs` semantics |
| Proficiency rank labels | `reference/pf2e/src/scripts/config/index.ts` (`CONFIG.PF2E.proficiencyLevels`) | localize the configured label for ranks 0–4; no module rank-name mapping |
| Save / Perception rank | `reference/pf2e/src/module/actor/character/document.ts` prepared Statistics; official `reference/pf2e/src/module/actor/character/sheet.ts` `numberToRank` preparation | `actor.saves.*.rank` and `actor.perception.rank` projected with the Core-configured label |
