# PF2e source map

## Analysed baseline

- PF2e commit: `73c870286aeba87c25ccc0258028afedfc888d05` (`v14-dev`, 2026-08-12)
- Manifest: `reference/pf2e/system.pf2e.json` — PF2e 8.4.0, Foundry minimum 14.361, verified 14.365
- Core character class: `CharacterSheetPF2e` in `reference/pf2e/src/module/actor/character/sheet.ts`
- Inheritance: `CharacterSheetPF2e` → `CreatureSheetPF2e` (`src/module/actor/creature/sheet.ts`) → `ActorSheetPF2e` (`src/module/actor/sheet/base.ts`). These are Foundry Application V1 sheets and are reference material, not runtime dependencies.

## Sheet composition and tabs

The primary template is `reference/pf2e/static/templates/actors/character/sheet.hbs`. Its actual primary tabs are Character, Actions, Inventory, Spellcasting, Crafting, Proficiencies, Feats, Effects, Biography, and PFS. Their templates live in `reference/pf2e/static/templates/actors/character/tabs/`. Actions additionally has encounter/exploration/downtime tabs; Spellcasting has known-spells/rituals/activations.

## Runtime data used in Milestone 1

The adapter reads the same character Actor document directly and uses runtime surfaces prepared by PF2e: `actor.level`, `actor.system.attributes.hp`, `actor.armorClass`, `actor.perception`, `actor.saves`, and `actor.skills`, with `actor.getStatistic(slug)` only as a guarded fallback. It neither calls `actor.sheet.getData()` nor imports PF2e source aliases.

## Future feature areas

| Area | Principal PF2e references |
|---|---|
| Shared item, roll, form, and D&D handling | `src/module/actor/sheet/base.ts`, `src/module/actor/creature/sheet.ts` |
| Character context and listeners | `src/module/actor/character/sheet.ts` |
| Strikes/actions | `static/templates/actors/character/tabs/actions.hbs`, `static/templates/actors/character/partials/strike.hbs` |
| Inventory | `static/templates/actors/character/tabs/inventory.hbs`, `src/module/actor/inventory/` |
| Feats | `src/module/actor/character/feats/`, `static/templates/actors/character/tabs/feats.hbs` |
| Spellcasting | `src/module/actor/spellcasting.ts`, `src/module/item/spellcasting-entry/`, `static/templates/actors/character/tabs/spellcasting.hbs` |
| Crafting | `src/module/actor/character/crafting/`, `static/templates/actors/character/tabs/crafting.hbs` |
| Effects | `static/templates/actors/character/tabs/effects.hbs`, shared condition/effect item handlers in actor sheets |
| Proficiencies | `static/templates/actors/character/tabs/proficiencies.hbs`, character sheet context preparation |
| Biography/PFS | `static/templates/actors/character/tabs/biography.hbs`, `static/templates/actors/character/tabs/pfs.hbs` |

## Foundry V2 decision

Milestone 1 uses `HandlebarsApplicationMixin(ApplicationV2)` rather than `DocumentSheetV2`. `DocumentSheetV2` supplies generic form submission, permissions, and sheet configuration, but this app is deliberately an additional read-only comparison window rather than a registered replacement Document sheet. Direct Application V2 ownership also keeps the official PF2e sheet registration untouched. Reassess `DocumentSheetV2` before editable forms are introduced.

The bundled Foundry 14 declarations at `reference/pf2e/types/foundry/client/applications/api/` confirm `ApplicationV2`, Handlebars `PARTS`, actions, and partial renders. They do not declare `detachWindow()`. The UI therefore capability-detects that optional runtime method and produces a visible warning rather than silently assuming an API.
