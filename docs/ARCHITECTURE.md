# Architecture decisions

## Application base: `ApplicationV2`

Milestone 2 retains `HandlebarsApplicationMixin(ApplicationV2)` as the single application base. `DocumentSheetV2` provides document binding, a standard document property, permissions/form defaults, and sheet-configuration integration, and would be preferable for a registered replacement sheet. This console is intentionally a simultaneous companion to the official PF2e sheet: its constructor/API, directory launcher, instance map, and detached-window lifecycle all model that use case directly.

Editing is deliberately narrow and explicit. The application asks the Actor document (`canUserModify`) before rendering or executing an update, uses an Application V2 action scoped to its local form, and updates the document through `Actor.update`. This avoids pretending to inherit PF2e's V1 `ActorSheetPF2e` form behavior. `DocumentSheetV2` has the same Application V2 PARTS and detached-window capability, so it offers no lifecycle advantage for the companion use case. If the project later becomes a registered alternative Actor sheet, migration should occur at that boundary; maintaining both bases is explicitly rejected.

## Tabs

The sheet uses Foundry V14's native `ApplicationV2.TABS`, `_prepareTabs("primary")`, `tabGroups`, `data-action="tab"`, and `data-group="primary"` contract. There is no module-owned click handler or active-tab state. Each PF2e primary tab has its own Handlebars PART, even while later-milestone tabs render placeholders, enabling targeted partial renders later.

## Detached windows

`ApplicationV2.detachWindow()` is an official Foundry V14 API and detached use is first-class. The header action calls it. The small `typeof` guard is only defensive fault reporting; no compatibility or architecture decision depends on the method being optional. Event handlers use their supplied targets and document APIs rather than the global DOM.
