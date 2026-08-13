# PF2e V2 Player Console

A full alternative Pathfinder Second Edition character sheet targeting long-term feature parity with the official PF2e character sheet. It uses Foundry VTT 14 Application V2 technology through `HandlebarsApplicationMixin(DocumentSheetV2)` and treats detached/pop-out use on a second monitor as a first-class workflow.

The official sheet remains available during development for comparison and fallback only; that does not limit the final product scope. The V2 sheet is intended to become a selectable registered Actor sheet once enough vertical slices are complete. Milestone 2 currently covers the document-bound shell, checks, name editing, localization, live synchronization, and detached-window foundation—not later sheet functions.

## Compatibility

- Foundry VTT 14 (minimum build 361; verified build 365)
- Pathfinder Second Edition 8.4.0

The analysed reference is the read-only submodule commit `73c870286aeba87c25ccc0258028afedfc888d05`. It is not packaged by this module and must never be edited.

## Development installation

1. Clone with `git submodule update --init`.
2. Link this repository into `<Foundry Data>/modules/pf2e-v2-player-console` (or copy it there).
3. Enable **PF2e V2 Player Console** in a PF2e world.
4. Right-click a character in the Actors directory and choose the localized **Open V2 Character Sheet** action.

No compilation is required; Foundry loads `src/module.js` as an ES module. See the [manual tests](docs/MANUAL_TESTS.md), [feature parity matrix](docs/FEATURE_PARITY.md), [source map](docs/PF2E_SOURCE_MAP.md), and [architecture](docs/ARCHITECTURE.md).

## Milestone 2 scope

Implemented: native V2 tabs/PARTS, document binding and permission-aware name form, PF2e Statistic rolls for Perception (including secret), saves, and exposed skills, English/German localization, Actor/embedded-Item refresh hooks, and `detachWindow()` support. Inventory, drag/drop, strikes/damage, actions, spellcasting, feats, crafting, and effects management remain later milestones; their PARTS intentionally stay placeholders.
