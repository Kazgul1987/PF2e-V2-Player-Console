# PF2e V2 Player Console

An experimental, additional Pathfinder 2e character sheet built on Foundry VTT 14's `ApplicationV2`. The official PF2e sheet remains the default; this module is currently the Milestone 2 checks-and-editing vertical slice.

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

## Milestone 2 manual test

See [the manual test plan](docs/MANUAL_TESTS.md) for roll, modifier-key, permission, editing, live-sync, lifecycle, and detached-window scenarios. **Detach to Browser Window** uses the official Foundry V14 `ApplicationV2.detachWindow()` API.

## Scope and known limitations

Milestone 2 implements PF2e Statistic rolls for Perception, saves, and visible skills plus permission-aware character-name editing. Inventory, strikes, spells, feats, effects, crafting, biography, and PFS interactions remain future vertical slices. Detached windows are a first-class supported workflow. See [the parity matrix](docs/FEATURE_PARITY.md), [source map](docs/PF2E_SOURCE_MAP.md), and [architecture decisions](docs/ARCHITECTURE.md).
