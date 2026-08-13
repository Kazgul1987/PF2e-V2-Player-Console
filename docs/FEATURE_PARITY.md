# Feature parity matrix

Baseline: PF2e 8.4.0 at `73c870286aeba87c25ccc0258028afedfc888d05`. “Core” was inventoried from the character sheet class, its inherited creature/base sheets, and the ten tab templates listed in the source map. “Planned” means deliberately outside Milestone 1.

| Feature | Core | V2 | Status | Core reference |
|---|---:|---:|---|---|
| Additional sheet beside core sheet | — | ✓ | done | Actor directory integration |
| Application V2 + Handlebars PARTS | — | ✓ | done | Foundry V14 application declarations |
| Name, portrait, level | ✓ | ✓ | done | header partial / character Actor |
| HP and AC display | ✓ | ✓ | done | sidebar/header / prepared Actor statistics |
| Perception display | ✓ | ✓ | done | character tab / `actor.perception` |
| Saves display | ✓ | ✓ | done | character tab / `actor.saves` |
| Skills display | ✓ | ✓ | done | character/proficiencies / `actor.skills` |
| Live Actor and embedded Item refresh | ✓ | ✓ | done | Foundry document hooks |
| Tab shell and state | ✓ | ✓ | done | `sheet.hbs` primary navigation |
| Detached-window entry point | — | partial | runtime-capability guarded | Foundry Application V2 runtime |
| Limited-observer presentation | ✓ | — | planned | `limited.hbs` |
| Edit name/portrait/HP/resources | ✓ | — | planned M2 | character sheet form handlers |
| Perception, save, and skill rolls | ✓ | — | planned M2 | creature/base roll listeners |
| Roll dialogs, options, modifiers, event keys | ✓ | — | planned M2 | sheet helpers/check APIs |
| Encounter, exploration, downtime actions | ✓ | — | planned M4 | `tabs/actions.hbs` |
| Strikes, MAP, damage, critical damage | ✓ | — | planned M4 | strike partial / prepared strikes |
| Auxiliary actions, ammo, reload, toggles | ✓ | — | planned M4 | strike partial / sheet listeners |
| Inventory list and item sheets | ✓ | — | planned M3 | `tabs/inventory.hbs` |
| Inventory create/delete/edit/sort/D&D | ✓ | — | planned M3 | base/character item handlers |
| Containers, carry state, bulk, quantity, uses | ✓ | — | planned M3 | actor inventory / inventory templates |
| Equipment, investment, shields, coins | ✓ | — | planned M3 | inventory runtime/templates |
| Consumables and identification | ✓ | — | planned M3 | physical/consumable item APIs |
| Feat groups and slots | ✓ | — | planned M5 | character feats / feat-slot partial |
| Feat editing, sorting, D&D, browser | ✓ | — | planned M5 | feats handlers/browser |
| Spellcasting entries and collections | ✓ | — | planned M6 | spellcasting tab/runtime |
| Prepared/spontaneous/innate/focus/ritual | ✓ | — | planned M6 | spell collections/entries |
| Slots, cast, attack, DC, heightening | ✓ | — | planned M6 | spellcasting listeners/runtime |
| Activations, staff charges, spell D&D | ✓ | — | planned M6 | spellcasting activations |
| Craft formulas and crafting abilities | ✓ | — | planned M8 | character crafting directory |
| Daily crafting, quantities, craft action | ✓ | — | planned M8 | crafting handlers/runtime |
| Proficiency viewing/editing | ✓ | — | planned M7 | `tabs/proficiencies.hbs` |
| Effects and conditions management | ✓ | — | planned M7 | `tabs/effects.hbs` |
| Biography editing | ✓ | — | planned M7 | `tabs/biography.hbs` |
| PFS fields and reputation | ✓ | — | planned M7 | `tabs/pfs.hbs` |
| Context menus and tooltips | ✓ | — | planned per slice | sheet/base listeners |
| Full permissions and ownership behavior | ✓ | — | planned | base/limited sheets |

## Manual definition of done for every future interaction

Test once in the normal Application V2 window and once after detaching: invoke the control, exercise any PF2e dialog, verify the resulting Document/ChatMessage against the core sheet, then change the same data from the core sheet and confirm synchronization.
