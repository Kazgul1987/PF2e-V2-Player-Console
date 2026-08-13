# Feature parity matrix

Baseline: PF2e 8.4.0 at `73c870286aeba87c25ccc0258028afedfc888d05`.

| Feature | PF2e Core | V2 | Status | Core Reference | Runtime API | Manual Test |
|---|---:|---:|---|---|---|---|
| Companion sheet | — | ✓ | done | Actor directory integration | module API | M2-05 |
| Application V2 PARTS | — | ✓ | done | Foundry V14 Application V2 | `PARTS` | static |
| Native primary tabs | ✓ | ✓ | done | character `sheet.hbs` | `TABS`, `_prepareTabs`, `changeTab` | all tabs |
| One PART per primary tab | ✓ | ✓ | shell done | character tab templates | Handlebars PARTS | all tabs |
| Detached window | — | ✓ | done | Foundry V14 Application V2 | `detachWindow()` | M2-01–06 |
| Name, portrait, level | ✓ | ✓ | done | header partial | Actor properties | M2-05 |
| Edit name | ✓ | ✓ | done | header partial / V1 form | `canUserModify`, `Actor.update({name})` | M2-05/06 |
| HP and AC display | ✓ | ✓ | display only | sidebar / prepared statistics | Actor runtime data | M2-05 |
| Perception check | ✓ | ✓ | done | creature sheet handler | `actor.getStatistic("perception").roll(params)` | M2-01/04 |
| Fortitude/Reflex/Will checks | ✓ | ✓ | done | base sheet `roll-check` | `actor.getStatistic(slug).roll(params)` | M2-02/04 |
| Standard skill checks | ✓ | ✓ | done | base sheet `roll-check` | `actor.getStatistic(slug).roll(params)` | M2-03/04 |
| Lore/custom skill checks | ✓ | ✓* | runtime-discovered | Actor prepared skills | `actor.skills` + `getStatistic(slug)` | M2-03 |
| Dialog/message modifier keys | ✓ | ✓ | mirrored helper | `sheet/helpers.ts` | user settings + Statistic roll params | M2-04 |
| Live Actor/item refresh | ✓ | ✓ | done | Foundry document hooks | `updateActor`, `createItem`, `updateItem`, `deleteItem` | M2-05/07 |
| Permission-aware edit UI | ✓ | ✓ | name slice | Foundry Document | `actor.canUserModify(game.user,"update")` | M2-06 |
| HP, hero points, XP editing | ✓ | — | later edit slices | sidebar/header handlers | PF2e resource/form APIs | — |
| Inventory and strikes | ✓ | — | planned M3+ | inventory/actions tabs | — | — |
| Feats/spells/crafting/effects/PFS | ✓ | — | planned later | respective tabs | — | — |

`*` Lore/custom skills are supported when PF2e exposes them through `actor.skills`; fixture coverage in a running world is still required.
