# PF2e V2 Player Console

An experimental, additional Pathfinder 2e character sheet built on Foundry VTT 14's `ApplicationV2`. The official PF2e sheet remains the default; this module is currently the Milestone 1 read-only vertical slice.

## Compatibility

- Foundry VTT 14 (minimum build 361)
- Pathfinder Second Edition 8.4.0 (the reference checkout requires Foundry 14.361 and is verified on 14.365)

The analysed reference is submodule commit `73c870286aeba87c25ccc0258028afedfc888d05`. Everything below `reference/` is read-only and is not packaged by this module.

## Install for development

1. Clone with `git submodule update --init`.
2. Link this repository into `<Foundry Data>/modules/pf2e-v2-player-console` (or copy it there).
3. Enable **PF2e V2 Player Console** in a PF2e world.
4. Right-click a character in the Actors directory and choose **Open V2 Character Sheet**.

No compilation is required. Foundry loads `src/module.js` as an ES module.

## Milestone 1 manual test

1. Open a player character from the Actors directory using **Open V2 Character Sheet**.
2. Confirm name, portrait, level, HP, AC, Perception, saves, and skills match the core sheet.
3. Change HP or another displayed value in the core sheet and confirm the V2 sheet refreshes.
4. Switch all placeholder tabs and confirm their active state survives an actor update.
5. Use **Detach to Browser Window** in the window controls. Foundry 14 distributions exposing `ApplicationV2#detachWindow` detach the app; otherwise the module reports an explicit compatibility warning and leaves the app open.
6. Repeat tab navigation and the live-update test in the detached window.

## Scope and known limitations

Milestone 1 is intentionally read-only. Rolls, editing, inventory, strikes, spells, feats, effects, crafting, biography, and PFS interactions remain future vertical slices. The detach entry point is capability-detected because the Foundry 14 type declarations bundled by the referenced PF2e checkout do not declare `detachWindow`; this avoids assuming that every browser/distribution supplies it. See [the parity matrix](docs/FEATURE_PARITY.md) and [source map](docs/PF2E_SOURCE_MAP.md).
