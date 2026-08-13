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
| Inventory/strikes/actions/spells/feats/crafting/effects | ✓ | — | M3+ | respective core tabs | — | — | Not implemented in this milestone |
