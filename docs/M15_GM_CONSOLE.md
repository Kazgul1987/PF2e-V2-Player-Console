# M15 GM Multi-Character Console architecture

## Audit

`PF2eCharacterSheetV2` is a `HandlebarsApplicationMixin(DocumentSheetV2)` with separate
`PARTS` for its header, sidebar, navigation, and ten tabs. The adapters already isolate
PF2e document reads and the controllers already isolate document mutations, rolls,
drag/drop, and item workflows. The remaining coupling was the sheet's context preparation,
its ApplicationV2 action map, tab state, document hooks, presentation attributes, and DOM
listeners, all of which assumed the single `document` exposed as `this.actor`.

## Shared view boundary

`prepareCharacterView(actor, options)` is the reusable boundary. It requires an explicit
actor, constructs the shared actor view model, and lazily invokes only the adapter needed
for the active tab. Both the normal document sheet and each console pane call it. The
console registers and composes the existing sheet templates as partials; it does not copy
sheet markup, embed another Application, or manufacture nested window chrome.

Each pane has stable `data-actor-id` and `data-pane-id` roots. Console action wrappers
resolve the actor from that root before invoking the same action functions used by the
document sheet. This keeps rolls and controller operations scoped to the originating
actor even though multiple characters share one ApplicationV2 event surface.

## Lifecycle and performance foundation

The console is guarded at its API, constructor, Actor Directory entry, and render lifecycle
by `game.user.isGM`. It retains independent tab state per actor, offers grid/column/row
layouts, and prepares only one tab model per visible pane. Actor and embedded-item hooks
filter events against the console's actor IDs. Hooks are removed on close, and presentation
preferences are applied to the single console root, making the view safe to render in a
normal or detached Application host without querying a parent window.

Later M15.2 work can replace the filtered whole-console render with per-pane part replacement
without changing the actor-explicit context, stable roots, shared templates, or action routing.
