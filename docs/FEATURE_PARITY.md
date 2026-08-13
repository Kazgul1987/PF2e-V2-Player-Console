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
| Name editing | ✓ | ✓ | implemented | core header / Foundry form | V2 form, `document.update` | M2-FORM-01/02 | Only reviewed editable field |
| Observer/read-only | ✓ | ✓ | implemented | Foundry document sheet | `isEditable`, `canUserModify` | M2-PERM-01 | UI and submit both guarded |
| Detached roll | — | ✓ | implemented | Application V2 | `detachWindow()` | M2-ROLL-01–05 | Browser validation required |
| Detached edit | — | ✓ | implemented | Application V2 form | form handler, Document update | M2-FORM-03 | Browser validation required |
| Live Actor/item refresh | ✓ | ✓ | implemented | document hooks | update/create/delete hooks | M2-LIVE-01 | UUID filtered and cleaned on close |
| Localization foundation | ✓ | ✓ | implemented | PF2e and module lang files | `game.i18n`, `localize` | M2-LOC-01/02 | English and German |
| HP/hero points/XP editing | ✓ | — | pending | PF2e resource handlers | pending review | — | Display only; no generic update |
| Strikes/actions/spells/feats/crafting/effects | ✓ | — | M4+ | respective core tabs | — | — | Not implemented in this milestone |

## Milestone 3 inventory detail


| Inventory list/grouping/images/names | ✓ | ✓ | implemented | `base.ts:prepareInventory`, `item-line.hbs` | `actor.inventory`, prepared Items | M3-INV-01 | Seven core physical-item sections and recursive containers |
| Quantity | ✓ | ✓ | implemented | base increase/decrease handlers | `item.update` | M3-INV-03 | Core modifier increments; schema owns validation |
| Uses/charges | ✓ | ✓ | implemented | consumable document `_preUpdate` | `item.update` | M3-INV-13 | Ammo and consumables with uses |
| Carry/equipped/invested | ✓ | ✓ | implemented* | creature `changeCarryType`; character toggle | `actor.changeCarryType`, `toggleInvested` | M3-INV-04/05 | `*` attached/in-slot menu variants pending |
| Container nesting/assignment/expansion | ✓ | ✓ | implemented | sortable inventory; `toggle-container` | `stowOrUnstow`, Item update | M3-INV-06 | PF2e cycle guard and persisted collapsed state |
| Item sheet open/edit/delete/create | ✓ | ✓ | implemented | base item handlers | Item sheet, delete dialog, embedded create | M3-INV-02/10 | Basic per-section creation; browser/search pending |
| Actor internal sorting/drop | ✓ | ✓ | implemented* | base sortable handlers | `sortRelative`, `stowOrUnstow` | M3-INV-07 | `*` stack-on-drop parity pending |
| Compendium/world/other Actor drop | ✓ | ✓ | implemented* | base `_onDropItem` | `fromDropData`, Inventory.add, transfer API | M3-INV-08 | `*` core internal size adjustment unavailable externally |
| Detached drag/drop | — | ✓ | awaiting runtime | Foundry V14 DataTransfer | same drop APIs | M3-INV-09 | Browser/platform cross-window behavior must be signed off |
| Bulk | ✓ | ✓ | implemented | `prepareInventory` | prepared Actor/Item bulk | M3-INV-01 | Display only; no local calculation |
| Coins | ✓ | ✓ | implemented* | base currency handlers/dialog | currency/addCoins/removeCoins | M3-INV-12 | `*` denomination controls; core dialogs/sell-all pending |
| Consumables | ✓ | ✓ | implemented | creature `consume-item` | `consume()` | M3-INV-13 | PF2e owns effects, chat, charges, auto-destroy |
| Shield state | ✓ | ✓ | inventory-complete | physical/shield documents | prepared HP/hardness/state | M3-INV-14 | Raise Shield deferred to Actions milestone |
| Identification | ✓ | display only | pending GM action | base `toggle-identified` | prepared identification; internal popup | M3-INV-01 | Item sheet remains available; no privilege expansion |
| Inline summary/chat/context/browser | ✓ | — | pending | item summary renderer/base handlers | `toMessage`; internal UI helpers | future | Concrete next step: detached-safe V2 summary and action menu |
