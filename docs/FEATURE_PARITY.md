# Feature parity matrix

Baseline: PF2e 8.4.0 at read-only commit `73c870286aeba87c25ccc0258028afedfc888d05`. “Implemented” still requires the listed running-world test.

| Feature | PF2e Core | V2 Sheet | Status | Core Reference | Runtime API | Manual Test | Notes |
|---|---:|---:|---|---|---|---|---|
| Full alternative Actor sheet target | ✓ | architectural | planned parity | `register-sheets.ts` | `Actors.registerSheet` | future | Core sheet remains only a development comparator |
| Document-bound V2 base | — | ✓ | done | Foundry V14 declarations | `DocumentSheetV2`, `document` | static/M2-FORM | Registration deferred, not blocked |
| PARTS/native primary tabs | ✓ | ✓ | shell done | character `sheet.hbs` | `PARTS`, `TABS` | M2-TABS-01 | One PART per primary tab; later tabs are placeholders |
| Perception basic roll | ✓ | ✓ | implemented | creature `perception-check` | `getStatistic("perception").roll` | M2-ROLL-04 | Runtime verification required |
| Perception secret roll | ✓ | ✓ | implemented | creature handler `data-secret` branch | `Statistic.roll({extraRollOptions:["secret"]})` | M2-ROLL-05 | Dedicated UI action |
| Standard skill roll | ✓ | ✓ | implemented | base `roll-check` | `getStatistic(slug).roll` | M2-ROLL-01 | No local formula |
| Lore/custom skill roll | ✓ | ✓* | runtime-discovered | prepared `actor.skills` | `getStatistic(slug).roll` | M2-ROLL-01 | `*` Fixture coverage pending |
| Save roll | ✓ | ✓ | implemented | base `roll-check` | `getStatistic(slug).roll` | M2-ROLL-01 | Fortitude, Reflex, Will |
| Roll dialog | ✓ | ✓ | mirrored | `sheet/helpers.ts` | `skipDialog` | M2-ROLL-02 | Shift inversion included |
| GM/blind modifier | ✓ | ✓ | mirrored | `sheet/helpers.ts` | `messageMode` | M2-ROLL-03 | Ctrl or Meta |
| Name editing | ✓ | ✓ | implemented | core header / focused input | `document.update` on blur/Enter | M2-FORM-01/02/03 | Escape restores the Document value; no global form |
| Observer/read-only | ✓ | ✓ | implemented | Foundry document sheet | `isEditable`, `canUserModify` | M2-PERM-01 | UI and focused update action both guarded |
| Detached roll | — | ✓ | implemented | Application V2 | `detachWindow()` | M2-ROLL-01–05 | Browser validation required |
| Detached edit | — | ✓ | implemented | Application V2 focused input | blur/keyboard handler, Document update | M2-FORM-03 | Browser validation required |
| Live Actor/item refresh | ✓ | ✓ | implemented | document hooks | update/create/delete hooks | M2-LIVE-01 | UUID filtered and cleaned on close |
| Localization foundation | ✓ | ✓ | implemented | PF2e and module lang files | `game.i18n`, `localize` | M2-LOC-01/02 | English and German |
| HP/hero points/XP editing | ✓ | — | pending | PF2e resource handlers | pending review | — | Display only; no generic update |
| Spellcasting | ✓ | ✓ | Milestone 6 implemented | spellcasting entry/collection documents | prepared collection and entry APIs | M6 tests | Runtime sign-off remains listed below |
| Crafting | ✓ | ✓* | Milestone 7 implemented/partial | character crafting runtime | ability and crafting APIs | M7 tests, M7-FIX-01–10 | `*` Quick Alchemy and private picker remain pending |
| Effects | ✓ | — | pending | effects tab | pending review | — | Not started |
| Strikes/actions | ✓ | ✓ | Milestone 4 implemented | respective core tabs | prepared PF2e runtime APIs | M4 tests | Runtime sign-off remains listed below |
| Feats | ✓ | ✓ | Milestone 5 complete | character feats tab/collection/group | `actor.feats` | M5 tests, M5-FINAL-01–07 | Feature slice complete; Create remains a transparent safe omission and Foundry runtime checks remain listed below |

## Milestone 3 inventory detail


| Inventory list/grouping/images/names | ✓ | ✓ | implemented | `base.ts:prepareInventory`, `item-line.hbs` | `actor.inventory`, prepared Items | M3-INV-01 | Seven core physical-item sections and recursive containers |
| Quantity | ✓ | ✓ | implemented | base increase/decrease handlers | `item.update` | M3-INV-03 | Core modifier increments; schema owns validation |
| Uses/charges | ✓ | ✓ | implemented | consumable document `_preUpdate` | `item.update` | M3-INV-13 | Ammo and consumables with uses |
| Carry: held/worn/stowed/dropped | ✓ | ✓ | implemented; runtime sign-off | `carry-type.hbs` | `actor.changeCarryType` | M3-FINAL-04 | Options follow core conditions; stowed requires a stowing container |
| Carry: attached | ✓ | ✓ | implemented; runtime sign-off | `carry-type.hbs` | `actor.changeCarryType` | M3-FINAL-04 | Offered only for `item.isAttachable`; PF2e opens ItemAttacher |
| Carry: implanted | ✓ | ✓ | implemented; runtime sign-off | `carry-type.hbs` | `actor.changeCarryType` | M3-FINAL-04 | Offered only when `system.usage.type === "implanted"` |
| Carry: installed | derived | display/internal | parity by omission; runtime sign-off | physical usage; `carry-type.hbs` | prepared item state | M3-FINAL-04 | Valid core carry value, but core presents no manual installed action; module likewise does not |
| Carry: in-slot | ✓ | ✓ | implemented; runtime sign-off | `carry-type.hbs` | `actor.changeCarryType(...,{inSlot:true})` | M3-FINAL-04 | Offered only for worn usage with a slot |
| Invested | ✓ | ✓ | implemented; runtime sign-off | character toggle | `toggleInvested` | M3-FIX-05 | PF2e validates eligibility and limits |
| Container nesting/assignment/expansion | ✓ | ✓ | implemented | sortable inventory; `toggle-container` | `stowOrUnstow`, Item update | M3-INV-06 | PF2e cycle guard and persisted collapsed state |
| Item sheet open/edit/delete/create | ✓ | ✓ | implemented | base item handlers | Item sheet, delete dialog, embedded create | M3-INV-02/10 | Basic per-section creation; browser/search pending |
| Actor internal sorting/drop | ✓ | ✓ | implemented* | base sortable handlers | `sortRelative`, `stowOrUnstow` | M3-INV-07 | `*` stack-on-drop parity pending |
| Compendium Item Drop | ✓ | ✓ | implemented; runtime sign-off | base `_handleDroppedItem` | `fromDropData`, `inventory.add` | M3-INV-08/09 | Core internal size adjustment is unavailable externally |
| World Item Drop | ✓ | ✓ | implemented; runtime sign-off | base `_handleDroppedItem` | `fromDropData`, `inventory.add` | M3-INV-08/09 | PF2e owns target stacking |
| Actor-to-Actor full stack | ✓ | ✓ | implemented; runtime sign-off | `moveItemBetweenActors` | `transferItemToActor` | M3-FIX-01 | Quantity selection defaults to the available stack |
| Actor-to-Actor partial transfer | ✓ | ✓ | implemented; runtime sign-off | `ItemTransferDialog` | `transferItemToActor` | M3-FIX-01 | Module DialogV2 selects/clamps quantity; PF2e mutates source/target |
| Transfer quantity dialog | ✓ | ✓ | implemented; detached runtime sign-off | internal `ItemTransferDialog` | `DialogV2` + transfer API | M3-FINAL-05 | String content and button-local form lookup avoid a main-window `document` dependency |
| Existing target stack/new stack | ✓ | ✓ | implemented; runtime sign-off | `findStackableItem` | `findStackableItem`, `transferItemToActor` | M3-FIX-02 | New-stack choice is enabled only when a compatible target stack exists |
| Merchant purchase | ✓ | ✓ | implemented; runtime sign-off | `moveItemBetweenActors` purchase mode | `transferItemToActor(...,true)` | M3-FINAL-02/03 | PF2e owns price/coins; non-empty backpacks are rejected |
| Merchant gift/move | ✓ | ✓ | implemented; runtime sign-off | `ItemTransferDialog` owner branch | `transferItemToActor(...,false)` | M3-FINAL-03 | Offered and controller-accepted only when `item.isOwner` |
| Ammo default purchase quantity | ✓ | ✓ | implemented; runtime sign-off | `ItemTransferDialog.wait` | `item.isOfType("ammo")` | M3-FINAL-02 | Defaults to `min(10,item.quantity)`; other purchases default to 1 |
| Creature trade negotiation | ✓ | fallback | intentionally restrictive; pending | private `#attemptTrade`, `TradeDialog` | no stable external entry point | M3-FIX-03 | Unsafe non-GM cases are blocked and directed to core; not full parity |
| Credstick credit transfer | ✓ | safely blocked | pending | internal `transferCredits` | deliberately non-public | M3-FINAL-01 | Exact core category detection runs before ordinary item transfer; localized warning |
| Detached transfer dialog | ✓ | ✓ | implemented; runtime sign-off | core `DialogV2` subclass | `DialogV2.wait` | M3-FINAL-05 | HTML string plus callback-local form lookup; browser validation remains required |
| Container target transfer | ✓ | ✓ | implemented; runtime sign-off | drop container lookup | transfer `containerId` | M3-FIX-01/02 | PF2e validates and stacks/creates in target container |
| Detached drag/drop | — | ✓ | awaiting runtime | Foundry V14 DataTransfer | same drop APIs | M3-INV-09 | Browser/platform cross-window behavior must be signed off |
| Bulk | ✓ | ✓ | implemented | `prepareInventory` | prepared Actor/Item bulk | M3-INV-01 | Display only; no local calculation |
| Coins add/remove (PP/GP/SP/CP) | ✓ | ✓ | implemented | base currency handlers/dialog | currency/addCoins/removeCoins | M3-FIX-08 | PF2e performs mutations; core by-value/break-coins dialog, distribution and sell-all remain pending |
| Consumables | ✓ | ✓ | implemented | creature `consume-item` | `consume()` | M3-INV-13 | PF2e owns effects, chat, charges, auto-destroy |
| Shield state | ✓ | ✓ | inventory-complete | physical/shield documents | prepared HP/hardness/state | M3-INV-14 | Raise Shield deferred to Actions milestone |
| Identification/mystify | ✓ | ✓* | partial | base `toggle-identified` | `setIdentificationStatus` | M3-FIX-04 | GM/editable only; direct identified/unidentified works, but core's internal status popup is not reproduced |
| Inline item summary | ✓ | ✓* | partial | `ItemPF2e.getDescription()` | shared PF2e-aware description helper | M11-FIX-02..05 | Core enrichment, alterations, addenda, GM visibility, and rule-generated description text; rich core summary actions remain pending |
| Send item to chat | ✓ | ✓ | implemented; runtime sign-off | base `item-to-chat` | `item.toMessage(event)` | M3-FIX-07 | PF2e creates the chat card |

## Milestone 4 actions detail

| Feature | PF2e Core | V2 Sheet | Status | Runtime API | Manual Test | Notes |
|---|---:|---:|---|---|---|---|
| Strike list / label / image | ✓ | ✓ | implemented; runtime sign-off | `actor.system.actions` | M4-STRIKE-01/08 | Includes prepared unarmed, natural and rule-granted entries |
| Strike total / MAP 0 | ✓ | ✓ | implemented; runtime sign-off | `variants[0].label/roll` | M4-STRIKE-01/02 | No local modifier |
| MAP 1 (-5/-4 etc.) | ✓ | ✓ | implemented; runtime sign-off | `variants[1]` | M4-STRIKE-02 | Agile result comes from PF2e |
| MAP 2 (-10/-8 etc.) | ✓ | ✓ | implemented; runtime sign-off | `variants[2]` | M4-STRIKE-02 | Exact prepared label and function |
| Attack roll | ✓ | ✓ | implemented; runtime sign-off | `variant.roll({event})` | M4-STRIKE-01/02 | PF2e Check dialog/card/options/targets |
| Damage roll | ✓ | ✓ | implemented; runtime sign-off | `strike.damage({event})` | M4-STRIKE-03 | No formula construction |
| Critical damage | ✓ | ✓ | implemented; runtime sign-off | `strike.critical({event})` | M4-STRIKE-04 | Fatal/deadly/runes remain Core-owned |
| Alternate usages (thrown/melee) | ✓ | ✓ | implemented; runtime sign-off | `strike.altUsages` runtime methods | M4-STRIKE-07/08 | Nested prepared usages, index resolved as Core does |
| Versatile damage | ✓ | ✓ | implemented; runtime sign-off | prepared options + trait toggle runtime | M4-STRIKE-03 | Modular choice is also presented through prepared auxiliaries |
| Weapon traits / reload / range | ✓ | ✓ | implemented display | prepared strike/Item data | M4-STRIKE-01 | PF2e labels/tooltips |
| Ammo display | ✓ | ✓ | implemented; runtime sign-off | prepared `ammunition` | M4-STRIKE-05 | Compatible and magazine data are not inferred |
| Linked ammo selection | ✓ | ✓ | implemented; runtime sign-off | `weapon.update(selectedAmmoId)` | M4-STRIKE-05 | Same Document update as Core |
| Magazine ammo selection/unload | ✓ | display only | partial | no stable complete external workflow | M4-STRIKE-05 | Core source logic and subitem UI are internal |
| Reload popup | ✓ | — | safe gap | internal `WeaponReloader` | M4-STRIKE-06 | Auxiliary reload works if supplied; no deep import |
| Auxiliary actions | ✓ | ✓ | implemented; runtime sign-off | `auxiliaryActions[].execute` | M4-STRIKE-07 | Options are runtime-driven |
| Weapon usage / hands | ✓ | ✓ | implemented; runtime sign-off | ready/hands/alt usage/auxiliaries | M4-STRIKE-07 | No direct carry mutation |
| Action item list | ✓ | ✓ | implemented; runtime sign-off | Actor action/feat Items | M4-ACTION-01 | Suppressed and canonical blast handling match Core |
| Reaction list | ✓ | ✓ | implemented; runtime sign-off | `actionCost.type` | M4-ACTION-02 | Core classification |
| Free-action list | ✓ | ✓ | implemented; runtime sign-off | `actionCost.type` | M4-ACTION-03 | Core classification |
| Exploration list / active | ✓ | ✓ | implemented; runtime sign-off | traits + `system.exploration` | M4-ACTION-04 | Open/summary/chat/use/toggle active |
| Downtime list | ✓ | ✓ | implemented; runtime sign-off | downtime trait | M4-ACTION-05 | Open/summary/chat/use |
| Rule-element toggles | ✓ | ✓ | implemented; runtime sign-off | synthetics + `toggleRollOption` | M4-STRIKE-09 | Boolean/suboption, dynamic module toggles |
| Send action to chat | ✓ | ✓ | implemented; runtime sign-off | `item.toMessage(event)` | M4-ACTION-01 | PF2e chat card |
| Open action item | ✓ | ✓ | implemented; runtime sign-off | `item.sheet.render(true)` | M4-ACTION-01 | Detached browser check required |
| Action use/roll | ✓ | ✓* | partial | registered `game.pf2e.actions`; Item chat fallback | M4-ACTION-01 | Internal `createUseActionMessage` cannot be imported |
| Elemental Blast | ✓ | — | pending / safe omission | no public runtime class | future M4 follow-up | Core constructs internal `ElementalBlast`; canonical item is not duplicated |
| Detached strike roll | — | ✓ | statically scoped; runtime sign-off | Application action + runtime strike | M4-DETACH-01 | No global sheet DOM selector |

## Milestone 5 feats detail

| Feature | Status | Core Reference | Runtime API / notes |
|---|---|---|---|
| Feat list | implemented | `character/tabs/feats.hbs` | prepared `actor.feats` Items |
| Grouping and slots | implemented | `character/feats/index.ts`, `group.ts` | runtime groups, slots and labels; no hardcoded categories |
| Features / nested grants | implemented | `FeatGroup.assignFeat/#getChildSlots` | ancestry/class features and prepared child grants |
| Action cost | implemented | feat chat/item templates | `item.actionCost` + PF2e `actionGlyph` helper; otherwise localized Passive |
| Traits | implemented | Feat Document | prepared trait slugs and `CONFIG.PF2E` labels |
| Summary | partial | internal summary renderer | detached-safe enriched description; rich Core actions pending |
| Open Item | implemented | common edit handler | `item.sheet.render(true)` |
| Send to Chat | implemented | common chat handler | `item.toMessage(event)` |
| Delete | implemented | common delete handler | `deleteDialog` (modifier bypass); Core grant lifecycle retained |
| Sorting | implemented | `_onSortItem` / base sortable | `sortRelative` for unslotted group |
| Internal D&D | implemented | `_onSortItem` | cross-group/slot moves via `actor.feats.insertFeat`; same-Actor + slotted target + missing `slotId` is a no-op; nested grants are not independent move sources |
| Compendium Drop | implemented | `_onDropItem` | `fromDropData` then `insertFeat` |
| World Item Drop | implemented | `_onDropItem` | same copy path |
| Actor Drop | implemented | `_onDropItem` | copied via `insertFeat`, never physical transfer |
| Create | pending | no stable public blank-Feat workflow | Deliberately omitted: bonus is a group, not a Feat category; Browser search pending |
| Permissions | implemented | DocumentSheet editability | controls hidden and controller `canUserModify` guard |
| Detached | implemented statically | Application V2 | part-local listeners/event targets; native cross-window D&D needs runtime test |
| Search/filter/browser | pending | private Core Compendium Browser flow | safe omission; no private UI copied |

## Milestone 6 – Spellcasting

| Focus resource capability | Status | Notes |
|---|---|---|
| Focus Pool display | implemented | Prepared Focus values are rendered as pips. |
| Focus Pool left-click increase | implemented | Delegates `+1` to the PF2e Actor resource API. |
| Focus Pool right-click decrease | implemented | Suppresses the context menu and delegates `-1` to the PF2e Actor resource API. |
| Focus Cantrip counter parity | implemented | The Core `cantrips` group without uses renders `∞ / ∞`; Focus pips remain exclusive to the Focus Spell group. |

| Capability | Status | Notes |
| --- | --- | --- |
| Entry rendering / multiple entries | implemented | `ActorSpellcasting.collections`, including rituals |
| Prepared / cantrips / ranks / slots | implemented | Core prepared groups and concrete empty/available/expended slots |
| Spontaneous / innate / focus | implemented | Rendering and `entry.cast`; all consumption remains in PF2e |
| Flexible | partial | Core groups/slots render and cast; the private preparation-app workflow is not cloned |
| Rituals | implemented | Render/open/summary/chat; Core ritual `cast` is chat-only |
| Item activations | safe omission | Inventory/Core activation owns charges |
| Cast / consumption | implemented | `entry.cast({rank, slotId})`; no local counters |
| Editable current spell slots | implemented | Targeted entry update of `system.slots.slotN.value`; PF2e validates and persists |
| Editable maximum spell slots | implemented | Targeted entry update of `system.slots.slotN.max`; PF2e prepares/clamps the resulting slots |
| Prepared assignment / unprepare | implemented | Concrete slot drop / button use `prepareSpell` |
| Expended toggle | implemented | Core `setSlotExpendedState` API |
| Prepared slot swap | implemented | Core `swapSlotPositions` API, limited to classic prepared (non-flexible) entries |
| Spell D&D / entry move | implemented | Core `addSpell({groupId})`; prepared slot targets remain distinct |
| Entry D&D | pending | Sorting entries is nonessential and official sheet-specific |
| Spell open / summary / chat | implemented | Document sheet, enriched description, non-consuming `toMessage` |
| Attack / DC | implemented | Entry statistic check; prepared statistic DC display |
| Delete spell | pending | Avoids conflating deletion with unprepare in this slice |
| Delete entry / create entry | pending | Official dialog/default construction is not reproduced |
| Signature spells | partial | Prepared flags can render; management remains in PF2e preparation UI |
| Detached | implemented | Application-local listeners and capability-checked drop targets |
| Permissions | implemented | Mutations require Actor update permission; read-only open/summary/chat remain visible |

### Milestone 6 slot-count addendum

| Capability | Status | Notes |
| --- | --- | --- |
| Editable current slot count | implemented | Persistent entry update; Core clamps `value` |
| Editable maximum slot count | implemented | Persistent entry update; Core rebuilds prepared data on preparation |

## Milestone 7 – Crafting

| Capability | Status | Notes |
| --- | --- | --- |
| Entry rendering | implemented | All runtime `CraftingAbility` objects |
| Prepared formulas | implemented | Core `getSheetData()` |
| Formula quantity | implemented | `setFormulaQuantity` |
| Batch size | implemented | Displayed from Core prepared data |
| Resources | implemented | Core current/max/cost, display-only |
| Prepare | implemented | Formula D&D delegates `prepareFormula` |
| Unprepare | implemented | `unprepareFormula(index)` |
| Craft | implemented | Ability `craft(index)` and registered known-formula Craft action |
| Quick Alchemy | pending | Official flow is not one public atomic API |
| Daily/Advanced Alchemy | implemented | `performDailyCrafting` / `resetDailyCrafting` |
| Daily Crafting visibility | implemented | Controls exist only when Core-prepared abilities include daily/alchemical crafting |
| Perform Daily Crafting | implemented | Enabled only before completion; controller delegates to `performDailyCrafting()` |
| Reset Daily Crafting | implemented | Enabled only after completion; controller delegates to `resetDailyCrafting()` |
| Daily state controls | implemented | Adapter reads the PF2e flag and controller independently guards ability presence and state |
| Open Item | implemented | Resolved Item sheet |
| Summary | partial | Shared enriched-description infrastructure; rich internal renderer unavailable |
| Chat | implemented | Item `toMessage` |
| D&D | partial | Formula-to-ability prepare; sorting and arbitrary Item drops omitted safely |
| Formula Browser | pending | Core FormulaPicker/browser UI is private |
| Permissions | implemented | Mutations hidden and controller-guarded |
| Detached | implemented | Application-local listeners and capability-checked targets; runtime sign-off required |

## Milestone 8 – Proficiencies

| Capability | Status | Core reference / boundary |
|---|---|---|
| Perception rendering | implemented | `character/document.ts` prepared `actor.perception`; sidebar rank is informational |
| Perception rank edit | safe omission | Official sheet does not expose it in the proficiency tab |
| Saving Throws rendering | implemented | prepared `actor.saves` / `getStatistic` |
| Saving Throw rank edit | safe omission | Class/rule-prepared; official proficiency tab has no save editor |
| Skills rendering | implemented | prepared `actor.system.skills.<slug>` trace rows, matching Core's proficiency template |
| Skill rank edit | implemented | `CONFIG.PF2E.skills` whitelist → `system.skills.<slug>.rank` only; a missing partial source entry is valid and starts at rank 0 |
| Skill modifier refresh after rank update | implemented | change listener awaits the Document update, then reads the newly prepared trace `value` |
| Skill DC refresh after rank update | implemented | newly prepared trace `dc`; no local `modifier + 10` calculation |
| Skill roll after rank update | implemented | resolves a fresh `actor.getStatistic(slug)` and delegates to `Statistic.roll()` |
| Lore rendering | implemented | prepared Lore statistic and embedded Item ID |
| Lore rank edit | implemented | Lore Item `system.proficient.value` |
| Lore open | implemented | embedded `item.sheet.render(true)` |
| Lore create/delete/name | pending | Core generic Item controls are outside the requested safe rank slice |
| Class DC | implemented | prepared class-DC Statistics and trace data; no local DC math |
| Multiple Class DCs | implemented | all entries in `actor.classDCs`, primary-first |
| Class DC rank edit | safe omission | Core summary is read-only |
| Armor proficiency | implemented | prepared `system.proficiencies.defenses` |
| Armor rank edit | safe omission | Core renders defense ranks as text |
| Weapon proficiency | implemented | prepared standard attack categories |
| Weapon rank edit | safe omission | standard Core rows are readonly |
| Martial/custom proficiency | implemented | visible prepared non-category attack entries; `sameAs` shown when present |
| Custom proficiency rank edit | implemented | only persistent `_source` entries with `custom:true` |
| Custom create/delete | pending | Core `ManageAttackProficiencies` dialog is private source UI; no fake predicate model |
| Spellcasting proficiency summary | implemented | read-only `actor.spellcasting.base` prepared Statistic |
| Permissions | implemented | markup plus `canUserModify(game.user,"update")` controller guard |
| Detached | implemented structurally | local change/action targets; no global document access; runtime verification required |

Milestone 8 is complete for the listed scope. Perception and saves are an additional proficiency summary in this sheet rather than a one-to-one copy of Core's proficiency-tab layout.

`definition`, `predicate`, `maxRank`, category aliases, auto changes, and Rule Element upgrades remain PF2e-owned. A synthetic or Rule-Element-only martial entry is display-only because editing additionally requires the raw source record and its explicit `custom` flag. Modifier and DC fields are never persisted. Rows without a numeric prepared modifier omit that field; a real zero remains visible as `+0`.

## Milestone 9 – Effects

| Capability | Status | Notes |
|---|---|---|
| Effect rendering | implemented | Real `actor.itemTypes.effect` documents |
| Effect duration | implemented | Core duration source and localization |
| Effect remaining duration | partial | Core `remainingDuration.remaining`, displayed in seconds; no local clock math |
| Effect summary | implemented | Shared enriched-description approach |
| Effect open | implemented | Embedded Item sheet |
| Effect chat | implemented | `toMessage` |
| Effect delete | implemented | Free Effect Items only; Core document lifecycle |
| Effect counter rendering | implemented | Only `system.badge.type === "counter"` is treated as a counter |
| Effect counter increase/decrease | implemented | `EffectPF2e.increase()` / `decrease()`; Core owns bounds and the end state |
| Granted effect protection | implemented | Delete/drag omitted when `grantedBy` exists |
| Condition rendering | implemented | `actor.conditions.active` |
| Valued condition rendering | implemented | `system.value.isValued`, not hardcoded slugs |
| Condition increase | implemented | `actor.increaseCondition(condition)` |
| Condition decrease | implemented | `actor.decreaseCondition(condition)` |
| Condition remove | implemented | `decreaseCondition(condition,{forceRemove:true})` |
| Overridden/inactive conditions | safe omission | Official character tab uses `conditions.active`; inactive entries are not independently mutated |
| Persistent damage recovery | implemented | Persistent Damage only; delegates the flat check, chat, and success removal to `ConditionPF2e.rollRecovery()` |
| Affliction rendering | implemented | Prepared affliction Item stage/onset data |
| Affliction stage | implemented | Core `increase()` / `decrease()` lifecycle methods |
| Effect D&D | implemented | Core-compatible drop source/context/badge flow and clone-to-clear-ID creation; granted drops are a safe no-op |
| Condition D&D | implemented | `fromDropData` then `actor.increaseCondition` |
| Affliction D&D | implemented | Same Core-compatible external Item source and clone-to-clear-ID flow; stage data is untouched |
| Add Condition UI | pending | No stable public selector application |
| Permissions | implemented | Markup and runtime Actor permission guards |
| Detached | implemented structurally | Application-local action/drop targets; runtime verification required |
| Spell-origin effect trait propagation | implemented | Empty Effect/Affliction trait arrays inherit only origin Spell traits present in runtime `CONFIG.PF2E.effectTraits` |

## Milestone 10 – Biography

| Capability | Status | Notes |
|---|---|---|
| Appearance rendering/editing | implemented structurally | Enriched display plus an explicit V2 edit action; Foundry runtime sign-off required |
| Height / Weight | implemented | Focused source updates |
| Appearance visibility | implemented | Owner toggle; private section omitted for non-owner |
| Backstory rendering/editing | implemented structurally | Local V2 ProseMirror element with explicit save/cancel; Foundry runtime sign-off required |
| Birth place | implemented | Focused source update |
| Backstory visibility | implemented | Persisted Core visibility field |
| Attitude / Beliefs | implemented | Focused text updates |
| Edicts / Anathema | implemented | Source arrays; add/edit/delete with validated indices |
| Likes / Dislikes / Catchphrases | implemented | Focused text updates |
| Personality visibility | implemented | Persisted Core visibility field |
| Campaign notes / Allies / Enemies / Organizations | implemented structurally | All six whitelisted fields use the local editor lifecycle; Foundry runtime sign-off required |
| Campaign visibility | implemented | Persisted Core visibility field |
| Rich-text save / cancel | implemented structurally | Element `save()` supplies canonical HTML; cancel disconnects without mutation |
| Rich-text enrichment | implemented structurally | Public `game.pf2e.TextEditor.enrichHTML` with roll data, owner secrets, and actor-relative UUID context; Foundry fallback retained; runtime syntax comparison required |
| Limited-owner visibility | implemented | Non-visible sections are absent from the view model and DOM |
| Permissions | implemented | Controls plus controller `canUserModify` guards; visibility also requires ownership |
| Detached editor | implemented structurally | Application-local V14 `HTMLProseMirrorElement`; no global document lookup or realm-sensitive `instanceof`; runtime sign-off required |

## Milestone 11 – PFS / Organized Play

| Capability | Status | Notes |
|---|---|---|
| Player Number | implemented | Nullable, focused update; current Core-template range 10000–99999 |
| Character Number | implemented | Nullable, focused update; range 2001–9999 |
| Level Bump | implemented | Boolean flag only; all mechanical preparation remains Core-owned |
| Current Faction | implemented | `CONFIG.PF2E.pfsFactions` options and whitelist |
| Reputation | implemented | All runtime-configured factions; nullable integers; no local ranks |
| School | safe omission | Source/config remain, but current official PFS tab has no School control or active flow |
| PFS Boon rendering | implemented | Prepared `actor.pfsBoons` only |
| Boon summary | implemented | Shared PF2e-aware `ItemPF2e.getDescription()` route |
| Boon open | implemented | Embedded Item sheet |
| Boon chat | implemented | PF2e `toMessage` |
| Boon delete | implemented | Owner and non-granted PFS Boons only |
| Boon browser | implemented | Public runtime feat tab with `pfsboon` and actor-level filter; discovery-only Browse is visible read-only and is not edit-gated |
| Read-only Browse parity | implemented | Observer/non-editable sheets retain Browse; every mutating PFS control remains disabled, hidden, and controller-guarded |
| Boon D&D | implemented | External genuine boons embed; normal feats and same-Actor drops are no-ops |
| Permissions | implemented | Read-only markup plus mutation guards |
| Detached | implemented structurally | Local tab-panel events and realm-safe `closest`; Foundry runtime verification required |

## UI / Theme

- [x] Classic burgundy/parchment theme
- [x] Remaster green/beige theme (default)
- [x] Low-glare dark theme
- [x] Comfortable and compact density
- [x] Responsive layouts for narrow, medium, and wide sheets
- [x] Sheet-local theming that remains scoped in detached windows

## Milestone 12.1 – Character dashboard and presentation runtime

| Capability | Status | Runtime boundary |
| --- | --- | --- |
| Theme initial render | implemented | The single `_onRender` applies the current client theme to the final Application V2 root after the superclass render. |
| Theme live change | implemented | Setting changes directly refresh every rendered console. |
| Density initial render | implemented | The same `_onRender` application writes the current client density to the final Application V2 root. |
| Density live change | implemented | Setting changes directly refresh every rendered console. |
| Attributes | implemented; runtime sign-off | Six prepared `system.abilities.*.mod` values; no calculation. |
| Attribute boost editing | partial / safe omission | Core `AttributeBuilder` is source-exported but not exposed through the public runtime API; edit opens the official sheet, without a private import. |
| Speed | implemented; runtime sign-off | Prepared `system.movement.speeds` values. |
| Languages | implemented; runtime sign-off | Prepared language slugs and Core configuration labels. |
| Language editing | partial / safe omission | Core `LanguageSelector` is not publicly exposed; official sheet fallback preserves campaign rarity, limits, and granted languages. |
| Shield stats/state | implemented; runtime sign-off | Held-shield identity and prepared shield hardness, HP, BT, raised, broken, and destroyed state. |
| Inventory section labels | implemented | Same seven Core-owned labels used by `prepareInventory()`. |
| Inventory section visual hierarchy | implemented; runtime sign-off | Category headings use semantic heading/accent tokens and remain visually stronger than the unchanged column labels. |
| Header AC summary | implemented | Header remains the sole prominent AC summary; the duplicate Character-tab AC card is removed. |
| Shield detail presentation | implemented; runtime sign-off | Defense is conditional on matching held/prepared Core shield data and exposes no locally derived state. |
| Perception heading clipping | implemented; runtime sign-off | A dedicated section supplies normal-flow spacing and explicit heading line height. |

## Milestone 13 – Persistent Sidebar / Core Resources

| Capability | Status | Notes |
|---|---|---|
| Persistent sidebar / client setting | Implemented | Enabled by default, outside tabs, live rerender of open sheets |
| Editable current HP | Implemented | Owner-only targeted source update; maximum is prepared/read-only |
| Hero Points display / adjustment | Implemented | PF2e resource API; hidden when prepared maximum is zero |
| AC / held shield summary | Implemented | Prepared Actor and held-shield state only |
| Perception / saves | Implemented | Existing Statistic roll action |
| Initiative | Implemented | Prepared ActorInitiative statistic and core roll API |
| Dying / Wounded | Implemented | Read-only prepared status values and maxima; no HP inference or condition mutation |
| Immunities / Weaknesses / Resistances | Implemented | Prepared IWR instances and their Core-composed `label` getters |
| Save / Perception rank labels | Implemented | Localized Core proficiency configuration replaces numeric `R#` labels |
| Hero Points observer UX | Implemented | Read-only display has no action marker, button role, interactive hint, pointer, or hover state |
| Responsive / detached | Implemented | Left rail when wide, compact two-column resource band when narrow |

## Milestone 13.2 – Application sizing

| Capability | Status | Notes |
|---|---|---|
| Native Application V2 resize | Implemented | `window.resizable` is explicitly enabled; no module resize/drag engine |
| Detached responsive sizing | Implemented | Foundry owns the detached lifecycle; viewport and application-relative CSS reflow without fixed root dimensions |
| Proficiencies overflow | Fixed | Shrinkable card/row tracks and bounded rank controls replace intrinsic minimum-width pressure |

## Milestone 13.4 – Presentation fixes

| Capability | Status | Notes |
|---|---|---|
| Sidebar stat-row layout | implemented | Main and meta rows own their intrinsic vertical space; Perception, Initiative, and save metadata cannot collide with following statistics |
| Compact spell trait presentation | implemented | First three ordered traits remain directly visible and excess traits use a compact `+N` chip |
| Hidden spell trait tooltip | implemented | All presentation-hidden labels remain available through Foundry tooltip/title and a localized accessible label |

## Milestone 14 – Ornamentation layer

| Capability | Status | Notes |
|---|---|---|
| Ornamentation Off | implemented | No M14 decoration selectors match; the functional theme remains unchanged |
| Ornamentation Subtle | implemented; runtime sign-off | Default client preference; restrained header corners, sidebar frame, dividers, card accents, and active-tab lines |
| Ornamentation Ornate | implemented; runtime sign-off | Controlled double/inset frames and stronger lines without utility-button decoration |
| Theme-aware decorations | implemented; runtime sign-off | Dedicated bronze/nature, brass/burgundy, and desaturated metal token values for Remaster, Classic, and Dark |
| Detached-safe decorations | implemented structurally | Sheet-root scope, responsive reduction, pointer-transparent geometry, and no resize-grip z-index |
