# PF2e source map

## Baseline and boundaries

The read-only reference is PF2e commit `73c870286aeba87c25ccc0258028afedfc888d05` (8.4.0, Foundry V14). Core sheets are V1 reference implementations: `CharacterSheetPF2e` (`reference/pf2e/src/module/actor/character/sheet.ts`) inherits `CreatureSheetPF2e` (`.../creature/sheet.ts`) and `ActorSheetPF2e` (`.../sheet/base.ts`). No source alias or private class is imported by this module.

The current primary tabs come from `reference/pf2e/static/templates/actors/character/sheet.hbs`: Character, Actions, Inventory, Spellcasting, Crafting, Proficiencies, Feats, Effects, Biography, and PFS. Each corresponding template under `tabs/` maps to one V2 PART.

## Check runtime path

### Perception

- **Core UI:** character sheet character/sidebar templates.
- **Core handler:** `reference/pf2e/src/module/actor/creature/sheet.ts`, `perception-check` handler.
- **Core API:** `actor.perception.roll({ ...eventToRollParams(...), extraRollOptions })`.
- **External-safe path:** `actor.getStatistic("perception").roll(params)`.
- **Notes:** Statistic owns modifiers, roll options, dialog, degree of success, and chat output; the module never constructs a d20 roll.

### Saves (Fortitude, Reflex, Will)

- **Core UI:** character statistic elements carrying `data-statistic`.
- **Core handler:** `reference/pf2e/src/module/actor/sheet/base.ts`, `roll-check`.
- **Core API:** `actor.getStatistic(statisticSlug).roll(eventToRollParams(...))`.
- **External-safe path:** identical Actor/Statistic runtime surface; slugs are taken from prepared Actor saves.

### Skills, including Lore/custom statistics

- **Core UI:** character/proficiencies templates with `data-statistic`.
- **Core handler:** `reference/pf2e/src/module/actor/sheet/base.ts`, `roll-check`.
- **Core API:** `actor.getStatistic(statisticSlug).roll(params)`.
- **External-safe path:** skill rows originate from `actor.skills`; their slug is resolved again through `getStatistic`, so no standard-skill-only roll table is duplicated.
- **Notes:** runtime testing remains required for Actors whose Lore statistics are not present in `actor.skills`.

### Event parameters

`eventToRollParams` in `reference/pf2e/src/module/sheet/helpers.ts` is a build-time internal, not a safe module import. The controller mirrors only its current public semantics: `game.user.settings.showCheckDialogs` establishes the default; Shift inverts dialog skipping; Ctrl/Command selects `gm` for GMs and `blind` for other users. These parameters are passed to `Statistic.roll`.

## Editing and synchronization

The core name input is `reference/pf2e/static/templates/actors/character/partials/header.hbs` and relies on normal sheet form document update. The V2 slice uses the public Foundry equivalents `actor.canUserModify(game.user, "update")` and `actor.update({ name })`, validates a non-empty trimmed string, and renders read-only markup otherwise. Foundry hooks refresh only when Actor UUIDs match or `item.actor?.uuid` matches the displayed Actor. All four `updateActor`, `createItem`, `updateItem`, and `deleteItem` registrations are removed on close.

## Foundry V14 decisions

Foundry's Application V2 declarations define `TABS`, `_prepareTabs`, `_getTabsConfig`, `changeTab`, and `_onClickTab`; the module uses that native contract. `ApplicationV2.detachWindow()` is an official V14 API and a first-class requirement, with a guard retained solely for defensive diagnostics. See `docs/ARCHITECTURE.md` for the final ApplicationV2-versus-DocumentSheetV2 decision.
