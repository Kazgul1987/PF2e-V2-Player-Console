# Manual Foundry V14 / PF2e 8.4 tests

These tests require a running Foundry V14/PF2e world and cannot be replaced by Node validation. Compare with the official sheet, and repeat interaction cases after **Detach to Browser Window** where specified.

## M2-FORM-01 – Name via blur

1. Open the V2 sheet as owner, change the name, and blur the input.
2. Verify the Actor Document, directory, official PF2e sheet, V2 header, and V2 window title.
3. Confirm the sheet remains open and only `name` changed.

## M2-FORM-02 – Name via Enter

1. Put the cursor in the name field, change it, and press Enter.
2. Confirm there is no browser navigation or page reload.
3. Confirm the Actor name updates and all views synchronize.
4. Enter whitespace-only text and confirm validation prevents the update.

## M2-FORM-03 – Name via Escape and detached edit

1. Change the name, press Escape, and confirm the current Actor name is restored without an update.
2. Detach the sheet, change the name, and commit separately with blur and Enter.
3. Verify the Actor update and synchronization in the main Foundry window.
4. Confirm keyboard navigation reaches the input without returning to the main DOM.

## M2-ROLL-01 – Standard skill, Lore, and save

Roll Athletics, another skill, Fortitude, Reflex, and Will. If the Actor exposes Lore/custom entries through `actor.skills`, roll one. Compare modifiers, dialogs, options, and PF2e chat cards with core, then repeat detached.

## M2-ROLL-02 – Shift

Test with `showCheckDialogs` both enabled and disabled. Shift-click a skill/save and confirm it inverts the configured dialog behavior exactly as core does, in attached and detached windows.

## M2-ROLL-03 – Ctrl/Cmd

As GM, Ctrl-click (Command-click on macOS) and verify a GM roll. As a non-GM, verify a blind roll. Repeat with a dialog and detached; compare core.

## M2-ROLL-04 – Perception

Use normal Perception. Confirm the Statistic dialog/configured skip behavior and resulting check/chat card match core. Repeat detached.

## M2-ROLL-05 – Secret Perception

Use the dedicated Secret Perception control as GM and player. Confirm PF2e receives the `secret` roll option, secrecy/chat visibility matches the core `data-secret` control, modifier keys still work, and detached behavior is identical.

## M2-PERM-01 – Observer/Limited

1. Open an Actor as Owner, Observer, and Limited wherever core permits visibility.
2. Confirm Owner can edit and Observer/Limited see read-only name markup.
3. Attempt to trigger the focused name-update action as a non-owner and confirm the Document does not update and a localized error appears.
4. Compare permitted rolls and chat visibility with core.

## M2-LOC-01 – English

Select English, reload, and inspect directory action, tabs, name controls, section headings, secret action, placeholders, header control, and every validation/error notification for unresolved keys or hard-coded German.

## M2-LOC-02 – German

Repeat M2-LOC-01 in German. Confirm module-specific labels are German and reused PF2e labels follow PF2e's installed German localization.

## M2-TABS-01 – Tabs/PARTS and detached lifecycle

Open the sheet, visit every primary tab, detach, and visit every tab again. Confirm active state, placeholders, scrolling, and resizing. Close/reopen and confirm state is sane.

## M2-LIVE-01 – Actor and embedded Item synchronization

With attached and detached sheets open, update the Actor from core, then create, update, and delete an embedded Item. Confirm this sheet refreshes and an unrelated Actor does not. Close it and confirm later changes do not render a closed application or reveal leaked hooks.

## Required milestone sign-off

All cases above are mandatory in a running world. Particular regression focus: open → detach → switch tab → edit via blur/Enter/Escape → skill/save/perception/secret roll → operate dialog → external Actor/Item update. Static checks cannot prove browser-window focus, Foundry permission thresholds, localization loading, PF2e chat visibility, or sheet registration compatibility.

## Milestone 3 inventory

### M3-INV-01 – Inventory render
Open a character with every physical type; compare sections, image/name, quantity, prepared bulk, carry state, identification visibility, containers and shield data with core.
### M3-INV-02 – Item open
Open an item by name/edit control attached and detached; confirm the normal PF2e Item sheet opens.
### M3-INV-03 – Quantity
Use ±, Shift± and Ctrl/Cmd±; inspect embedded data, core display and V2 live refresh.
### M3-INV-04 – Equipped
Exercise held (one/two hands), worn, worn-in-slot, stowed, dropped, attached, and implanted on applicable item types; compare derived values and core.
### M3-INV-05 – Invested
Toggle eligible identified items below/at the Actor limit and confirm PF2e validation and both sheets agree.
### M3-INV-06 – Container
Open/close containers, drag items in/out and attempt self/descendant cycles. Confirm `containerId`, carry type and core display.
### M3-INV-07 – Internal D&D
Reorder root and nested items and move across containers/sections; reload and verify stable Document sort.
### M3-INV-08 – Compendium D&D
Drop physical Items from compendium, world Items and another Actor. Confirm copy vs move, stacking, permissions and core sync.
### M3-INV-09 – Detached D&D
Detach, then test main-window compendium/world/Actor → detached, detached internal → container/root, and detached sorting. Record browser/OS, console errors and whether native `DataTransfer` crosses the window. If blocked by browser security, use a same-window source as the documented fallback.
### M3-INV-10 – Delete
Delete normally and confirm; repeat with Ctrl/Shift bypass. Verify embedded deletion and core/V2 live sync, including container contents.
### M3-INV-11 – Observer
Verify visibility but no mutation controls; synthetically dispatch each mutating action/drop and confirm controller permission guards reject it.
### M3-INV-12 – Coins
Add/remove every denomination, attempt over-removal and compare `actor.inventory.currency` and core. Core sell-all/distribution dialogs are pending.
### M3-INV-13 – Consumable
Change charges and consume single/multi-use and auto-destroy examples; compare chat, quantity, uses and core.
### M3-INV-14 – Shield
Compare HP, maximum HP, hardness, broken/destroyed and held/worn states. Confirm Raise Shield is not presented in Inventory.

## M3 runtime limitations and sign-off

Node validation cannot run Foundry Document models or native cross-window drag/drop. All M3-INV cases therefore remain required in a Foundry V14/PF2e 8.4 world. Remaining known gaps are creature trade negotiation, credstick transfer, compendium size adjustment, the full core summary/identification popups, equipment browser, and full core currency/distribution/sell dialogs.

### M3-FIX-01 – Partial Actor Transfer
Give Actor A quantity 10, drop it on Actor B, select 3, and verify A=7 and B=3 against core. Repeat full-stack and with a target container.
### M3-FIX-02 – Existing Stack
Give both actors the same stackable item, transfer a partial quantity, and verify PF2e reuses the target stack. Repeat with **Create a new stack** and verify separate creation.
### M3-FIX-03 – Merchant and trade boundaries
Test Merchant→Character purchase, insufficient funds, Loot→Character, Character→Merchant, and Character→Character as player and GM. Compare prices and coin exchange with core. Verify a non-GM creature trade is blocked with the official-sheet fallback rather than silently moved.
### M3-FIX-04 – Observer controls and controller guards
Open as Observer/Limited. Verify no invest, consume, collapse, quantity/uses, carry, delete/create, drag, coin, or identification controls are visible. Synthetically invoke every mutating controller/drop and verify rejection.
### M3-FIX-05 – Carry types
On applicable fixtures test held 1/2, worn, worn-in-slot, stowed, dropped, attached, and implanted. Confirm unavailable choices are omitted and attachment opens PF2e's picker.
### M3-FIX-06 – Summary
Toggle descriptions open/closed in normal and detached sheets. Verify enriched links and visibility/secret handling and that only the local row changes.
### M3-FIX-07 – Send to Chat
Send identified and unidentified items in normal and detached sheets; compare PF2e chat cards and permissions with core.
### M3-FIX-08 – Currency
Add/remove PP, GP, SP and CP, including over-removal; compare currency and notifications with core. Record by-value/break-coins, distribute/withdraw and sell functions as pending.
### M3-FIX-09 – Detached Actor Transfer
Test main-window compendium, world Item and Actor Item → detached inventory, then detached internal root/container sorting and root↔container/container↔container moves. Record browser/OS limitations; if native DataTransfer cannot cross windows, use the same-window official flow rather than a global DOM workaround.

## Milestone 3 final fixup

### M3-FINAL-01 – Credstick
1. Give Actor A a credstick and drag it to Actor B.
2. Confirm that **no ordinary Item transfer** occurs.
3. Confirm the localized unsupported-credit notification appears and both Item inventories and credit balances remain unchanged.

### M3-FINAL-02 – Ammo Merchant Purchase
1. Put an ammo stack larger than 10 on a merchant and drag it to a character.
2. Confirm the dialog defaults to `min(10, item.quantity)` (10 for this fixture), while a non-ammo purchase defaults to 1.
3. Purchase and compare quantity, stacking, prices, and both Actors' coins with the PF2e Core sheet.

### M3-FINAL-03 – Merchant Gift
1. Open a merchant Item owned by the current user and drop it on a character.
2. Confirm both Purchase and Gift/Move are present; exercise each separately and verify PF2e receives purchase and non-purchase behavior respectively.
3. Repeat without ownership and confirm Gift/Move is absent and cannot be forced through a synthetic dialog result.

### M3-FINAL-04 – Installed
1. Use an appropriate Item whose prepared usage is `installed-in-*` and compare it with Core.
2. Confirm the V2 sheet displays its prepared installed state but offers no manual Installed carry action, matching Core's carry menu.
3. Recheck Attached (only `isAttachable`), Implanted (only implanted usage), and In-slot (only slotted worn usage).

### M3-FINAL-05 – Detached Transfer Dialog
1. Detach the V2 sheet, drag an Actor Item onto it, and open the transfer dialog.
2. Select quantity and target-stack behavior; for an owned merchant Item exercise Purchase and Gift/Move.
3. Complete and cancel transfers and confirm there is no DOM/window error or main-window focus dependency.

### M3-FINAL-06 – Read-only Regression
1. Open as Observer and Limited and confirm quantity, uses, carry, invest, consume, delete, create, container, currency, identification, and transfer mutation controls are absent.
2. Invoke controller actions/drop synthetically and confirm no mutation is possible.

## Runtime stabilization

### RUNTIME-01 – Direct API Open
1. Open the F12 console.
2. Call `game.modules.get("pf2e-v2-player-console").api.openCharacterSheet(actor)` for a PF2e Character.
3. Confirm the entire sheet renders.
4. Confirm the console contains no missing-Handlebars-partial error.

### RUNTIME-02 – Inventory Partial
1. Open a Character with several Inventory Items, including a container with contents.
2. Open the Inventory tab.
3. Confirm every `inventory-item.hbs` row, including nested rows, appears.
4. Check the console for template or partial errors.

### RUNTIME-03 – Actor Directory
1. Open the Actor Directory.
2. Right-click a PF2e Character.
3. Confirm **Open V2 Character Sheet** / **V2-Charakterbogen öffnen** appears.
4. Click it.
5. Confirm the V2 sheet opens.

### RUNTIME-04 – Unsupported Actor
1. Right-click an NPC (and, where available, Loot, Hazard, Familiar, and Vehicle Actors).
2. Confirm the V2 Character Sheet entry does not appear.

### RUNTIME-05 – PF2e Sheet Header Button
1. Open the normal PF2e Character Sheet.
2. Confirm its localized **Open V2 Character Sheet** header button is present.
3. Click it and confirm the V2 sheet opens.

### RUNTIME-06 – Detached
1. Open and detach the V2 sheet.
2. Open Inventory and expand nested Items and summaries; exercise the transfer dialog.
3. Open Actions and exercise strikes, Item summaries, roll dialogs, and permitted Actor updates.
4. Confirm both window consoles contain no partial, DOM, or cross-window errors.

### RUNTIME-07 – Validator
1. Run `node scripts/validate.mjs`.
2. Confirm the validator completes successfully.
3. Confirm `manifest` and `download` are checked against the versionless `releases/latest/download/` convention.

### RUNTIME-08 – Prepare Release
1. Use a disposable copy of the repository.
2. Run `node scripts/prepare-release.mjs 0.3.1`.
3. Confirm `version` changes to `0.3.1`.
4. Confirm `manifest` remains `${url}/releases/latest/download/module.json`.
5. Confirm `download` remains `${url}/releases/latest/download/${id}.zip` with no version in its path or filename.

### RUNTIME-09 – Actor Directory
1. Start Foundry V14 and open the Actor Directory.
2. Right-click a PF2e Character.
3. Confirm **Open V2 Character Sheet** / **V2-Charakterbogen öffnen** appears.
4. Click it and confirm the sheet opens.

### RUNTIME-10 – Unsupported Actor
1. Right-click an NPC (and, where available, Loot, Hazard, Familiar, and Vehicle Actors).
2. Confirm no V2 Character Sheet entry appears.

### RUNTIME-11 – Direct API
1. Call `game.modules.get("pf2e-v2-player-console").api.openCharacterSheet(actor)` for a PF2e Character.
2. Confirm the complete sheet renders without a missing-partial error.
3. Detach it, then open Inventory and Actions and confirm they remain operational.

## Application V2 primary tabs

### TAB-01 – Character → Actions
1. Open the V2 sheet.
2. Click Actions.
3. Confirm the Actions content appears and the Character content disappears.
4. Confirm the console contains no errors.

### TAB-02 – Actions → Inventory
1. Click Inventory.
2. Confirm the Inventory content appears and the Actions content disappears.
3. Confirm there is no `changeTab` error.

### TAB-03 – All primary tabs
1. Open Character, Actions, Inventory, Spellcasting, Crafting, Proficiencies, Feats, Effects, Biography, and PFS once each.
2. Confirm every tab opens without a runtime error.
3. Confirm exactly one content tab is active at a time.

### TAB-04 – Detached window
1. Detach the sheet.
2. Open every primary tab.
3. Confirm there are no DOM, Window, or `changeTab` errors in either console.

### TAB-05 – German localization
1. Set the Foundry language to German.
2. Inspect the tab navigation.
3. Confirm localized German labels appear and no `PF2E_V2_PLAYER_CONSOLE.*` keys are visible.

### TAB-06 – English localization
1. Set the Foundry language to English.
2. Inspect the tab navigation.
3. Confirm localized English labels appear and no `PF2E_V2_PLAYER_CONSOLE.*` keys are visible.

## Final native-tab and form stabilization

### TAB-FINAL-01 – Native active state
1. Open the sheet and confirm Character is active.
2. Click Inventory.
3. Confirm Inventory is visible and Character is hidden.
4. Confirm the console contains no errors.

### TAB-FINAL-02 – All tabs
1. Click Character, Actions, Inventory, Spellcasting, Crafting, Proficiencies, Feats, Effects, Biography, and PFS.
2. After each click, confirm exactly one content tab is active.
3. Confirm there is no `No matching tab element` error and no visible state stall.

### TAB-NAV-01 – Actions
1. Open the V2 sheet.
2. Click Actions.
3. Confirm Actions is visible.
4. Confirm Character is hidden.
5. Confirm there is no console error.

### TAB-NAV-02 – Inventory
1. Click Inventory.
2. Confirm Inventory is visible.
3. Confirm there is no console error.

### TAB-NAV-03 – All tabs
1. Click Character, Actions, Inventory, Spellcasting, Crafting, Proficiencies, Feats, Effects, Biography, and PFS once each.
2. After each click, confirm exactly one content tab is active.
3. Confirm there is no `No matching tab element` error.

### TAB-NAV-04 – Detached
1. Detach the sheet.
2. Click through every primary tab.
3. Confirm there is no error.
4. Confirm there is no DOM or Window problem.

### FORM-FIX-01 – No global Save
1. Open the sheet header.
2. Confirm there is no global Save button.

### FORM-FIX-02 – Name via blur
1. Change the character name.
2. Leave the field.
3. Confirm the Actor name updates without a reload or UI movement.

### FORM-FIX-03 – Name via Enter
1. Change the character name and press Enter.
2. Confirm the expected local name update occurs.
3. Confirm there is no browser reload, world reload, or freeze.
4. Repeat with Tab, Escape, and blur; confirm Tab/blur commit and Escape restores the current name without an update.

### FORM-FIX-04 – Detached name edit
1. Detach the sheet.
2. Change the name and commit it with blur or Enter.
3. Confirm the main window and detached window remain stable.

### FORM-FIX-05 – Tab remains selected
1. Activate Inventory.
2. Change the Actor name and wait for the update/render.
3. Confirm Inventory remains active.
4. Repeat in the detached window with Actions active.

## Milestone 4 — Actions and Strikes

### M4-STRIKE-01 – Basic Attack
1. Open a character with an equipped weapon and compare its prepared strike label, image, total, traits, reload, and range to Core.
2. Roll the first V2 strike button; verify the PF2e check dialog and chat card match Core.
3. Repeat with Shift and with Ctrl/Cmd (as GM and player where possible) and verify dialog/roll-mode behavior.

### M4-STRIKE-02 – MAP
1. Roll MAP 0, MAP 1, and MAP 2 from V2.
2. Repeat with an agile weapon and compare every displayed value, dialog, and card to Core.
3. Verify the module never shows a locally derived -5/-10 value.

### M4-STRIKE-03 – Damage
Roll normal damage, then select each offered versatile/modular type and repeat. Compare formulas/cards to Core.

### M4-STRIKE-04 – Critical Damage
Use fatal and deadly weapons, roll Critical Damage, and compare runes, critical specialization, splash, persistent, and additional dice with Core.

### M4-STRIKE-05 – Ammo
1. Equip a ranged weapon with compatible and incompatible ammunition.
2. Verify only Core-prepared compatible ammunition appears; select it and confirm Core reflects the selected ID.
3. Attack and verify consumption. For magazine weapons verify the V2 display, then use Core for reload/unload (documented V2 gap).

### M4-STRIKE-06 – Reload
Test every reload auxiliary offered by the V2 sheet. For a weapon that opens Core's `WeaponReloader`, confirm V2 does not offer a misleading substitute and record the known parity gap.

### M4-STRIKE-07 – Auxiliary Actions
Execute every dynamically offered Draw, Sheathe, Grip, Release, Interact, modular, reload, or shield action and compare carry/hand state and action glyph to Core.

### M4-STRIKE-08 – Unarmed
Test Fist plus an ancestry/rule-element Jaws, Claw, Tail, or similar strike; verify attack/MAP/damage works without a normal inventory Weapon assumption.

### M4-STRIKE-09 – Rule Toggle
1. Use a character with boolean and selectable Rule Element toggles.
2. Change each in V2; verify Actor and Core sheet state, then verify the prepared strike modifier changes.
3. Repeat from an Observer sheet and confirm mutation is refused.

### M4-ACTION-01 – Action Item
For a usable Action Item, test Open, inline Summary, Send to Chat, and Use/Roll. Confirm a registered PF2e action executes; otherwise confirm the documented PF2e Item-card fallback.

### M4-ACTION-02 – Reaction
Verify reaction grouping, glyph, traits, Open, Summary, Chat, and Use against Core.

### M4-ACTION-03 – Free Action
Verify free-action grouping, glyph, traits, Open, Summary, Chat, and Use against Core.

### M4-ACTION-04 – Exploration
Verify other/active grouping, toggle active state, live refresh, Open, Summary, Chat, and Use against Core.

### M4-ACTION-05 – Downtime
Verify grouping, traits, Open, Summary, Chat, and Use against Core.

### M4-DETACH-01 – Detached Strike
1. Detach the V2 sheet.
2. Test Attack, all MAP variants, Damage, Critical, linked Ammo, every Auxiliary Action, every Rule Toggle, Action Item open/chat/use, and roll dialogs.
3. Change weapon equip state, conditions, ammo quantity, and action Items in the main window and verify live refresh.
4. Check both browser-window consoles for DOM/window errors.

## Milestone 5 — Feats

### M5-FEAT-01 – Render
Open a character with several feats, select Feats, and compare all prepared groups, occupied/empty slots, features, nested grants, levels, traits, categories, and action costs with Core.

### M5-FEAT-02 – Open Item
Open a feat and confirm its real PF2e Item sheet appears.

### M5-FEAT-03 – Summary
Toggle a feat summary open and closed and confirm there are no DOM errors.

### M5-FEAT-04 – Chat
Send a feat to chat and confirm PF2e creates its standard chat card.

### M5-FEAT-05 – Sorting
Move a feat inside a permitted unslotted group and between permitted Core slots/groups; rerender and verify persistence and Core validation.

### M5-FEAT-06 – Compendium Drop
Drop a Feat from a compendium onto an appropriate group/slot and confirm the Actor receives it through PF2e insertion.

### M5-FEAT-07 – World Item Drop
Repeat M5-FEAT-06 with a World Item and verify the world source remains intact.

### M5-FEAT-08 – Permissions
Open as Observer; confirm summaries/open/chat remain available and Create, Delete, and outgoing mutation drag handles are absent or refused.

### M5-FEAT-09 – Detached
Detach the sheet, then Open, Summary, Chat, Delete confirmation, same-window sorting, and main-window-to-detached compendium/world/Actor drops as the browser permits. Check both consoles for cross-window DOM errors.

### M5-FEAT-10 – Alignment
Compare Actions, Inventory, and Feats at wide and narrow detached sizes. Confirm ordinary rows share the same left edge and container items, alternate strikes, nested grants, details, and summaries use only a small border/padding hierarchy.

### M5-FEAT-11 – Live update and tabs
Keep Feats active while creating, updating, and deleting Feat Items. Confirm the tab remains active after each existing lifecycle-hook rerender.

## Milestone 5 fixup — Core-aligned Feat insertion

### M5-FIX-01 – Compendium → Bonus
1. Drag a Feat from a compendium to the Bonus group.
2. Confirm it is inserted correctly.
3. Confirm no `category="bonus"` manipulation occurs.

### M5-FIX-02 – Compendium → Slot
1. Drag a Feat from a compendium to a valid Feat slot.
2. Confirm PF2e accepts it, chooses its Core fallback, or rejects it as appropriate.

### M5-FIX-03 – World Item → Group
1. Drag a World Feat Item to a Feat group.
2. Confirm PF2e inserts it into the appropriate group and leaves the World Item intact.

### M5-FIX-04 – Actor → Actor
1. Drag a Feat from another character to this character's Feats tab.
2. Confirm the PF2e collection determines placement.
3. Confirm this is a copy/insertion and not the physical-item transfer workflow.

### M5-FIX-05 – Internal Group Move
1. Move an existing Feat on the same Actor to another group or slot.
2. Confirm there is no duplicate.
3. Confirm PF2e determines whether the target is allowed and applies any fallback.

### M5-FIX-06 – Sorting
1. Reorder two Feats in the same unslotted group.
2. Rerender and confirm the order persists.

### M5-FIX-07 – Bonus Group
1. Inspect and move eligible Bonus Feats.
2. Confirm no Item category named `bonus` is required.

### M5-FIX-08 – Granted Child
1. Open a group containing a nested child grant.
2. Confirm the child renders correctly and has no independent drag handle.
3. Confirm open, summary, chat, and Core-owned deletion behavior still work without local grant mutation.

### M5-FIX-09 – Detached
1. Detach the sheet.
2. Exercise external and internal Feat drag/drop as the browser permits.
3. Open a summary and an Item sheet.
4. Confirm neither browser-window console reports DOM/window errors.

## Milestone 5 final — Slotted internal-drop guard

### M5-FINAL-01 – Internal slotted group header drop
1. Open a character with a slotted Feat group.
2. Drag an existing Feat from an occupied slot.
3. Drop it on the header or empty area of the same slotted group.
4. Confirm no concrete slot is targeted.
5. Confirm the Feat remains in its previous slot.
6. Confirm no duplication occurs.
7. Confirm the console reports no errors.

### M5-FINAL-02 – Internal valid slot move
1. Drag an existing Feat.
2. Drop it on a concrete valid slot in the same or another permitted group.
3. Confirm PF2e processes the move.

### M5-FINAL-03 – External drop without concrete slot
1. Drag a Feat from a compendium.
2. Drop it on a slotted group without targeting a concrete slot.
3. Confirm the drop is still delegated to `actor.feats.insertFeat(...)`.
4. Confirm PF2e decides the target, fallback, or rejection.

### M5-FINAL-04 – Unslotted sorting
1. Reorder two Feats in the same unslotted group.
2. Confirm the order persists.

### M5-FINAL-05 – Bonus drop
1. Drop an internal or external Feat on the Bonus group.
2. Confirm the existing Core behavior is preserved.

### M5-FINAL-06 – Granted child
1. Inspect a granted child Feat.
2. Confirm no unauthorized independent move is possible.

### M5-FINAL-07 – Detached
1. Detach the sheet.
2. Test an internal concrete-slot move.
3. Test an invalid group-header drop.
4. Confirm there are no DOM or Window errors.

## Milestone 6 – Spellcasting

- **M6-SPELL-01 – No Spellcasting:** Open a character without entries, select Spellcasting, verify the localized compact empty state and no console errors.
- **M6-SPELL-02 – Prepared Render:** Verify cantrips, several Core-provided ranks, prepared slots, and empty slots.
- **M6-SPELL-03 – Prepare:** Drop a known spell on a free slot; verify Core accepts it and the live hook refreshes the UI.
- **M6-SPELL-04 – Unprepare:** Remove a prepared assignment; verify the Spell Item remains known and the slot becomes empty.
- **M6-SPELL-05 – Cast Prepared:** Cast from a concrete slot; verify chat and that Core expends that slot.
- **M6-SPELL-06 – Expended Toggle:** Toggle available/expended and verify persistence through Core.
- **M6-SPELL-07 – Slot Swap:** Drag between two occupied slots in the same rank and verify spell and expended state remain Core-conformant.
- **M6-SPELL-08/09 – Spontaneous:** Verify known spells and slot value/max; cast at the displayed rank and verify only Core decrements slots.
- **M6-SPELL-10 – Flexible:** Compare rendering/casting with Core; verify the documented preparation/signature limitation.
- **M6-SPELL-11 – Innate Uses:** Cast until zero and verify Core decrements uses and blocks further casting.
- **M6-SPELL-12/13 – Focus:** Cast a focus spell and focus cantrip; verify Core focus-point costs and insufficient-points warning.
- **M6-SPELL-14 – Ritual:** Verify ritual rendering, open, summary, chat and Core's chat-only ritual cast flow.
- **M6-SPELL-15/16/17 – External drops:** Drop Compendium, world, and other-actor spells on entry/rank; verify Core `addSpell` copy/move behavior.
- **M6-SPELL-18 – Same Actor Entry Move:** Move between entries and verify no duplication.
- **M6-SPELL-19/20 – Invalid rank/focus mismatch:** Verify Core rejects invalid lower-rank and focus-to-normal-entry drops with its own warning.
- **M6-SPELL-21/22/23/24 – Controls:** Verify open, enriched summary toggle, non-consuming chat, and spell attack dialog/modifier keys.
- **M6-SPELL-25 – Multiple Entries:** Render prepared, innate, focus, and ritual entries together; verify unique targets.
- **M6-SPELL-26 – Detached Full Flow:** Detach; render, cast, summarize, open, prepare/toggle and drag/drop; verify the main UI and both DOM contexts remain stable.
- **M6-SPELL-27 – Permissions:** As Observer verify read-only rendering/open/summary/chat and absence or rejection of mutation controls.
- **M6 regression:** Recheck Character, Actions, Inventory, Feats, native tabs, name editing, and detached behavior.

## Milestone 6 fixup — Prepared slot swap guard

### M6-FIX-01 – Prepared Slot Swap
1. Open a classic (non-flexible) prepared caster with two occupied slots in one rank group.
2. Drag Spell A onto Spell B's slot.
3. Confirm Core `swapSlotPositions()` is used and both positions swap correctly.
4. Confirm there are no console errors.

### M6-FIX-02 – Spontaneous Same Rank
1. Open a spontaneous caster and drag Spell A onto Spell B in the same rank group.
2. Confirm `swapSlotPositions()` is not called, no prepared-slot error occurs, and there is no runtime crash.

### M6-FIX-03 – Focus
1. Drag one focus spell onto another focus spell.
2. Confirm there is no `swapSlotPositions()` call and no prepared-slot mutation.

### M6-FIX-04 – Innate
1. Drag an innate spell within the same rank group.
2. Confirm there is no `swapSlotPositions()` call and spell uses remain intact.

### M6-FIX-05 – Ritual
1. Drag Ritual A onto Ritual B in the rituals entry.
2. Confirm there is no `swapSlotPositions()` call, no access to a `SpellcastingEntryPF2e` document, and no runtime crash.

### M6-FIX-06 – Flexible
1. Drag a spell within the same rank group of a flexible caster.
2. Confirm there is no classic prepared-slot swap and Core behavior remains intact.

### M6-FIX-07 – Cross-Rank Prepared Move
1. Drag a prepared spell from rank 1 onto rank 2.
2. Confirm `swapSlotPositions()` is not called and the existing Core add/prepare flow handles the drop.

### M6-FIX-08 – Invalid Slot Index
1. Simulate drops with a missing, non-integer, or negative source or target `slotIndex`.
2. Confirm `swapSlotPositions()` is not called and no exception occurs.

### M6-FIX-09 – Detached
1. Detach the sheet and perform a prepared slot swap.
2. Perform a spontaneous same-rank drag and a ritual drag.
3. Confirm neither window reports cross-window or DOM errors.

## Milestone 6 addendum – slot count editing

- **M6-SLOT-01 – Current:** Change spontaneous rank-1 current slots and verify Item persistence.
- **M6-SLOT-02 – Maximum:** Change rank-1 maximum and verify persistence.
- **M6-SLOT-03 – Value > Max:** Enter a value above max and verify PF2e clamps it.
- **M6-SLOT-04 – Negative:** Enter a negative value and verify normalization/Core behavior.
- **M6-SLOT-05/06 – Prepared max:** Increase 3→4 and decrease 4→2; verify Core-prepared concrete slots.
- **M6-SLOT-07 – Cast after edit:** Edit current slots, cast, and verify Core consumption uses the new value.
- **M6-SLOT-08 – Observer:** Verify counters are visible without editable inputs.
- **M6-SLOT-09 – Detached:** Edit by blur and Enter, cancel with Escape, and verify no reload or tab change.

## Milestone 14.2 – Prepared Spellcasting Parity

- **M14.2-PREP-01 – Empty Prepared Slot:** Open a prepared, non-flexible caster. Verify empty slots are visible as compact dashed “Empty prepared slot” drop targets with a plus control.
- **M14.2-PREP-02 – Prepare Spell:** Use the plus control, select an eligible known collection spell, and verify it appears in the slot and persists after render.
- **M14.2-PREP-03 – Unprepare:** Use the compact remove control. Verify the slot becomes empty while the known Spell Item remains in the collection.
- **M14.2-PREP-04 – Drag to Slot:** Drag a collection spell onto an empty prepared slot. Verify Core prepares it and no exception occurs.
- **M14.2-PREP-05 – Swap:** Drag between two occupied slots in the same rank. Verify `swapSlotPositions` is used and the order persists.
- **M14.2-PREP-06 – Expended:** Toggle a prepared slot's expended state. Verify the Spell stays visible/prepared and only the expended state changes.
- **M14.2-PREP-07 – Flexible:** Open a flexible prepared caster. Verify no classic non-cantrip slot preparation UI, dashed targets, or unprepare controls appear.
- **M14.2-PREP-08 – Spontaneous:** Verify no classic prepare controls appear.
- **M14.2-PREP-09 – Innate:** Verify no classic prepare controls appear and per-spell uses still work.
- **M14.2-PREP-10 – Focus:** Verify no classic prepare controls appear and Focus Points still work.
- **M14.2-PREP-11 – Left Alignment:** Across all spell rows verify the icon, name, and action cost form a left-aligned information block while traits, state, and compact controls retain their columns and the trait `+N` remains unchanged.
- **M14.2-PREP-12 – Detached:** Detach the sheet and exercise button preparation, unprepare, spell-to-slot D&D, and slot swapping. Verify the picker and handlers use app-local/event-local DOM and neither window logs an exception.
- **M14.2-PREP-13 – Ritual:** Verify rituals receive no classic preparation controls and their existing chat-only cast flow remains available.

## Milestone 7 – Crafting

- **M7-CRAFT-01:** Character without abilities/formulas shows the localized empty state without errors.
- **M7-CRAFT-02/03:** Render one and multiple abilities; verify unique slugs, resources, capacity, and prepared rows.
- **M7-CRAFT-04/05:** Drop a valid Formula payload on an ability, then unprepare it; verify only Core preparation changes.
- **M7-CRAFT-06:** Edit prepared quantity by blur/Enter and cancel with Escape; verify Core batch/capacity limits.
- **M7-CRAFT-07/08:** Craft prepared and known formulas; verify official check or ability flow, Item result, and Core resource consumption.
- **M7-CRAFT-09/10:** Drop valid and invalid Formula payloads; verify Core accepts/rejects without crashes.
- **M7-CRAFT-11/12/13:** Open, summarize, and send prepared and known Formula Items to chat.
- **M7-CRAFT-14:** Quick Alchemy remains pending; perform it on the official sheet and confirm this sheet reflects resulting Actor/Item updates.
- **M7-CRAFT-15:** Detached: prepare, quantity, summary, D&D, and Craft; verify no cross-window DOM error.
- **M7-CRAFT-16:** Observer sees entries/formulas/open/summary/chat but no mutation controls; direct mutations reject.
- **M7 regression:** Recheck Character, Actions, Inventory, Feats, Spellcasting/slot editing, name editing, native tabs, and detached behavior.

## Milestone 7 fixup – guarded daily crafting

### M7-FIX-01 – No Daily Crafting
1. Open a Character without a Daily-Crafting ability and select Crafting.
2. Confirm Perform Daily Crafting and Reset Daily Crafting are not visible.
3. Confirm there are no console errors.

### M7-FIX-02 – Daily Crafting available
1. Open a Character with a Daily-Crafting ability and select Crafting.
2. Confirm both daily controls are visible.
3. While `dailyCraftingComplete` is false, confirm Perform is enabled and Reset is disabled.

### M7-FIX-03 – Perform
1. Select Perform Daily Crafting and confirm PF2e Core processes the crafting.
2. Confirm `dailyCraftingComplete` becomes true, Perform becomes disabled, and Reset becomes enabled.

### M7-FIX-04 – Reset
1. With Daily Crafting completed, select Reset Daily Crafting and confirm Core `resetDailyCrafting()` runs.
2. Confirm `dailyCraftingComplete` becomes false, Perform becomes enabled, and Reset becomes disabled.

### M7-FIX-05 – Controller safety
1. On a Character without Daily Crafting, deliberately invoke each daily action handler from the console/action dispatch.
2. Confirm Perform and Reset are both no-ops without a runtime exception.

### M7-FIX-06 – Double Perform
1. With `dailyCraftingComplete` true, deliberately invoke Perform again.
2. Confirm it is a no-op and no resource is consumed twice.

### M7-FIX-07 – Reset before Perform
1. With `dailyCraftingComplete` false, deliberately invoke Reset.
2. Confirm it is a no-op with no unexpected temporary-Item or resource mutation.

### M7-FIX-08 – Detached daily crafting
1. Detach the sheet, open Crafting, then perform and reset Daily Crafting.
2. Confirm there is no reload, UI movement, or cross-window DOM error.

### M7-FIX-09 – Spell-slot regression
1. Open Spellcasting and change both the current (`value`) and maximum (`max`) slot counts.
2. Confirm both persist and the crafting fix introduced no regression.

### M7-FIX-10 – Tab regression
1. Click Character, Actions, Inventory, Feats, Spellcasting, and Crafting.
2. Confirm every tab activates without a `changeTab` error.

## Milestone 8 – Proficiencies

### M8-PROF-01 – Render
1. Open a Character and select Proficiencies.
2. Confirm Perception/Saves, Skills, Lore, Class DC, Armor, Weapons, Other/Martial and applicable Spellcasting sections render without console errors.

### M8-PROF-02 – Perception
Compare rank, total modifier and any displayed DC with the official sheet. Confirm there is no rank control.

### M8-PROF-03 – Saves
Compare Fortitude, Reflex and Will ranks/modifiers (and available DCs) with the official sheet. Confirm all are read-only.

### M8-PROF-04 – Skill Rank
As owner, change one regular skill rank. Confirm the Actor updates only `system.skills.<slug>.rank`, PF2e recalculates the modifier, the official sheet agrees, and Proficiencies remains active.

### M8-PROF-05 – Lore
Use a Character with Lore. Confirm name/rank/modifier, change rank, verify the Lore Item's `system.proficient.value`, and open its Item sheet. Confirm no `system.skills` Lore record is written.

### M8-PROF-06 – Class DC
Use a Character with one Class DC and compare its label, primary marker, rank and DC with Core.

### M8-PROF-07 – Multiple Class DCs
Use a Character with multiple Class DCs. Confirm every distinct slug appears, primary is identified, and no row/ID collision occurs. Also test a Character with none.

### M8-PROF-08 – Armor
Compare every prepared armor category (including Unarmored/Light/Medium/Heavy when present) with Core. Confirm ranks are informational and AC is not changed.

### M8-PROF-09 – Weapons
Compare prepared Unarmed/Simple/Martial/Advanced categories with Core. Confirm standard category ranks are informational.

### M8-PROF-10 – Custom/Martial
Use a persistent custom weapon group/base proficiency and a Rule Element-created proficiency. Confirm both prepared visible entries render, only the persistent `custom:true` source entry offers rank editing, and `sameAs` is informational.

### M8-PROF-11 – Rule Element Update
Enable/disable a Rule Element that changes a rank/proficiency. Confirm the Actor update rerenders the V2 value from prepared data and no local override is written.

### M8-PROF-12 – Observer
Open as Observer. Confirm every rank is legible text, no rank selects appear, and Lore open remains available only according to Foundry Item visibility.

### M8-PROF-13 – Detached
Detach the sheet, select Proficiencies, edit a Skill, Lore, and persistent custom attack rank. Confirm the active tab remains, no page reload/cross-window error occurs, and Item opening uses the Document sheet API.

### M8-PROF-14 – Invalid Rank
Using devtools, attempt empty, fractional, `-1`, `5`, `999`, and nonnumeric rank values. Confirm the controller rejects each and no Actor/Item update occurs.

### M8-PROF-15 – Regression
Switch through Character, Actions, Inventory, Feats, Spellcasting, Crafting and Proficiencies; execute one established safe flow in each and confirm native tab navigation and existing behavior remain intact.

### M8-FIX-01 – Fresh Untrained Skill
1. Choose a Character whose regular skill has never been manually changed; optionally confirm `system.skills.<slug>` is absent from raw source.
2. Open Proficiencies and confirm the skill is Untrained.
3. Set it to Trained, confirm the Actor update occurs, reload, and confirm it remains Trained with no console error.

### M8-FIX-02 – Trained to Expert
Set a regular Trained skill to Expert. Confirm PF2e recalculates its modifier and the update writes no local modifier field.

### M8-FIX-03 – Expert to Untrained
Set an Expert regular skill back to rank 0 and confirm persistence after reload.

### M8-FIX-04 – Invalid Skill Slug
Pass a synthetic or false slug to the controller. Confirm it is a no-op and no arbitrary `system.skills.*` update path is produced.

### M8-FIX-05 – Invalid Rank
Try `-1`, `5`, `NaN`, and `1.5`. Confirm every value is a no-op and no Actor or Item update occurs.

### M8-FIX-06 – Lore Regression
Change a Lore rank. Confirm the Lore Item is updated and the regular-skill path is not used.

### M8-FIX-07 – Custom Martial Regression
Change a persistent custom martial proficiency rank and confirm it works. Confirm a synthetic proficiency remains read-only.

### M8-FIX-08 – Modifier Display
Open Armor and Weapon Proficiencies. Confirm pure rank rows have no artificial `—`, while genuine numeric modifiers supplied by Core remain visible.

### M8-FIX-09 – Zero Modifier
Find a Statistic with a genuine modifier of 0. Confirm the UI displays `+0` according to existing formatting and does not hide it as falsy.

### M8-FIX-10 – Detached
1. Detach the sheet and set a fresh Untrained regular skill to Trained.
2. Confirm the UI updates, Proficiencies remains active, no reload occurs, and there is no cross-window error.

### M8-FIX-11 – Tab Regression
Open Character, Actions, Inventory, Feats, Spellcasting, Crafting, and Proficiencies. Confirm every tab works without errors.

### M8-RUNTIME-01..07 – Prepared Skill Refresh Matrix
In order, test Untrained → Trained (including reload), Trained → Expert, Expert → Master, Master → Legendary, and Legendary → Untrained. After every update compare `_source.system.skills[slug].rank`, prepared `system.skills[slug].rank`, `actor.skills[slug].rank`, `.mod`, and `.check.mod` in devtools and confirm rank plus displayed modifier change together. Repeat with a synthetic/Rule Element bonus (the bonus must remain included) and repeat the edit in a detached sheet without stale UI. Also confirm Lore, custom Martial, class DCs, saves, and Perception still match Core.

### M8-RUNTIME2-01 – Expert → Master
On a level-6 Character, set Intimidation to Expert, note its modifier and DC, then select Master. Confirm rank, modifier, and DC are freshly PF2e-prepared; reload and confirm they persist. Do not assume concrete totals.

### M8-RUNTIME2-02 – Immediate Roll
Change Intimidation's rank and immediately roll its check. Confirm the chat roll modifier is the new PF2e runtime modifier and equals the V2 display.

### M8-RUNTIME2-03 – Official Sheet Comparison
Change a rank in V2, open Core's character sheet, and compare prepared rank, modifier, and DC between both sheets.

### M8-RUNTIME2-04 – Untrained → Trained
On a fresh skill, change Untrained to Trained and confirm rank, modifier, DC, and an immediate roll all update.

### M8-RUNTIME2-05 – Master → Legendary
Change Master to Legendary and confirm PF2e prepares a new modifier rather than retaining the prior value.

### M8-RUNTIME2-06 – Legendary → Untrained
Change Legendary to Untrained and confirm modifier and DC fall back according to the complete PF2e rules.

### M8-RUNTIME2-07 – Rule Element Bonus
Use a skill with an item, status, or Rule Element bonus; change its rank and confirm PF2e changes only what its rules require, preserves all applicable bonuses, and produces identical display and roll totals.

### M8-RUNTIME2-08 – Detached Update and Roll
Detach the sheet, change a skill rank, and confirm rank, modifier, DC, and an immediate roll update without reload or cross-window errors.

### M8-RUNTIME2-09 – Lore Regression
Change a Lore rank and confirm its Item-backed modifier and roll remain correct.

### M8-RUNTIME2-10 – Custom Martial Regression
Change a persistent custom Martial rank and confirm its existing source-backed flow is unchanged.

## Milestone 9 – Effects / Conditions / Afflictions

### M9-EFFECT-01 – Empty State
Open Effects on a character with none of the three document kinds; verify the localized empty state and no console errors.

### M9-EFFECT-02 – Normal Effect
Add a normal Effect; verify icon/name, Core duration/remaining value, summary, and embedded sheet open.

### M9-EFFECT-03 – Effect Chat
Send the Effect to chat and verify PF2e's Item chat output, not a module card.

### M9-EFFECT-04 – Delete Effect
Delete a free Effect and verify the embedded Item disappears and PF2e prepares the Actor again.

### M9-EFFECT-05 – Granted Effect
Compare a granted Effect with Core; verify the link marker and absence of delete/drag controls and that the grant remains intact.

### M9-EFFECT-06 – Non-valued Condition
Apply Prone; verify it has no +/- buttons and removal delegates to Core.

### M9-EFFECT-07 – Valued Condition Increase
Increase a valued Condition and compare its new prepared value with the official sheet.

### M9-EFFECT-08 – Valued Condition Decrease
Decrease a valued Condition and verify the Actor Core route determines its result.

### M9-EFFECT-09 – Condition to zero
Decrease a value-one Condition; compare removal/end state with the official sheet.

### M9-EFFECT-10 – Overridden/Inactive Condition
Create an overriding/reference combination; verify only Core-active conditions list and no hidden entry can be mutated.

### M9-EFFECT-11 – Persistent Damage
Apply persistent damage; verify formula, localized damage type, and DC where present. Use Recovery and verify PF2e owns the flat check, chat, and success removal.

### M9-EFFECT-12 – Affliction Render
On a V14-dev build supporting Afflictions, verify icon/name, current/max stage and onset without console errors.

### M9-EFFECT-13 – Affliction Stage
Use +/- and verify `AfflictionPF2e.increase/decrease` produces the same linked conditions, damage message, and deletion behavior as Core.

### M9-EFFECT-14 – Effect Drop
Drop a world/compendium Effect and verify PF2e embeds and prepares it with drop context and counter value preserved; compare a spell-origin Effect with the official sheet.

### M9-EFFECT-15 – Invalid Drop
Drop a weapon or feat and verify no mutation, notification, or crash.

### M9-EFFECT-16 – Observer
As Observer, verify rows, duration, summary and allowed sheets/chat remain visible while drop/delete/counter/stage controls are absent and runtime guards reject mutation.

### M9-EFFECT-17 – Detached
Detach, then test Effects tab, summary, item open/chat, condition +/-/remove, free Effect delete, all supported drops, and narrow-window wrapping; verify no cross-window error.

### M9-EFFECT-18 – Duration Progression
Advance combat/world time for a short Effect; verify Core hooks/preparation update remaining/expired display and the module runs no timer.

### M9-EFFECT-19 – Tab Regression
Click Character, Actions, Inventory, Spellcasting, Crafting, Proficiencies, Feats, and Effects; after each M9 mutation verify Effects remains active and native tabs show no errors.

### M9-FIX-01..04 – Effect Counter Boundary
On a real counter Effect, use + and - and confirm `EffectPF2e.increase/decrease` owns the badge changes, including decreasing value 1 to Core's resulting state. Confirm an ordinary Effect has no counter controls.

### M9-FIX-05..06 – Condition Scope and Recovery
Compare an active/inactive/overridden setup with the official character Effects tab and confirm only `conditions.active` is shown. On persistent damage, click Recovery and confirm `ConditionPF2e.rollRecovery()` produces Core chat and success/removal behavior; ordinary Conditions must have no Recovery control.

### M9-FIX-07..12 – Drop Matrix
Drop Compendium and world Effects, an Effect from another Actor, and a Compendium Affliction; confirm Rule Elements/source context survive, IDs do not collide, and Affliction stages remain Core-owned. Confirm a granted Effect is a no-op, a Condition uses `increaseCondition`, and Weapon/Feat/Spell drops are no-ops without mutation or errors.

### M9-FIX-13 – Detached Fixup
Detach the sheet and repeat Effect counter +/-, Condition +/-, persistent recovery, and each supported drop. Confirm local-window event targets work without cross-window errors or stale values.

### ROOT-FIX-01..12 – Tab Listener Roots and M8/M9 Regression

For Actions, Inventory, Feats, Spellcasting, Crafting, Proficiencies, and Effects, inspect the listener-bound root: it must resolve to `SECTION.tab-panel`, not `BUTTON[data-action="tab"]`. Repeat the checks while the relevant tab is initially inactive and in a detached sheet.

Change Intimidation from Expert to Master and confirm the controller update completes with source/prepared rank 3, refreshed PF2e modifier/DC, and the new modifier on a real roll. Also test an Untrained-to-Trained Core skill. Verify spell-slot value/max edits; prepared-formula quantity, daily crafting, and daily reset; Condition and Effect counters and persistent recovery; Inventory, Feat, Spellcasting, Crafting, and Effect/Affliction drops; Strike/MAP/damage/critical actions; and every native primary-tab navigation button without `No matching tab element found` errors.

### M9-FINAL-01 – Spell-Origin Effect Drop
Create an Effect with Spell origin and no effect traits, drop it on Effects, and compare with Core: only origin Spell traits present in `CONFIG.PF2E.effectTraits` propagate, while Rule Elements remain intact.

## Milestone 10 – Biography

- **M10-BIO-01 Empty:** open an empty biography; verify four clean sections and no console error.
- **M10-BIO-02 Appearance:** edit/save/reload Appearance.
- **M10-BIO-03 Height/Weight:** edit both; verify persistence and no global submit.
- **M10-BIO-04 Backstory:** edit formatted rich text, save, and reload.
- **M10-BIO-05 Birth Place:** edit and verify persistence.
- **M10-BIO-06 Personality:** edit Attitude, Beliefs, Likes, Dislikes, and Catchphrases.
- **M10-BIO-07 Add Edict:** add an empty entry, edit it, and reload.
- **M10-BIO-08 Delete Edict:** delete one entry only.
- **M10-BIO-09 Multiple Edicts:** create 3+, delete the middle, and verify order.
- **M10-BIO-10 Anathema:** add, edit, and delete entries.
- **M10-BIO-11 Campaign Notes:** edit rich text and save.
- **M10-BIO-12 Campaign people:** edit/save Allies, Enemies, and Organizations.
- **M10-BIO-13..16 Visibility:** toggle each of Appearance, Backstory, Personality, Campaign off; owner still sees it and Limited user does not.
- **M10-BIO-17 Persistence:** reload after each visibility toggle.
- **M10-BIO-18 Observer controls:** verify no inputs, editors, toggles, add, or delete controls.
- **M10-BIO-19 Inline enrichment:** test UUID links, inline rolls, and applicable PF2e inline syntax.
- **M10-BIO-20 Secrets:** compare owner and Limited rendering of a secret block with Core.
- **M10-BIO-21 Detached rich text:** detach; open, edit, save, cancel, follow links, and use inline rolls without cross-window errors.
- **M10-BIO-22 Enter:** change a simple field and press Enter; commit occurs without navigation/reload.
- **M10-BIO-23 Escape:** change a simple field and press Escape; persisted value is restored.
- **M10-BIO-24 Listener root:** inspect Biography listener root; it is `SECTION.tab-panel`, never the navigation button.
- **M10-RICH-01..06 Local lifecycle:** for Appearance, Backstory, Campaign Notes, Allies, Enemies, and Organizations, open the local editor, save/reload a change, reopen to verify raw source, then cancel a second change and verify no mutation.
- **M10-RICH-07..09 Enrichment:** save `@Check`, `@Damage`, a UUID link, an inline roll, and a secret block; compare links and Owner/Limited visibility with the official sheet.
- **M10-RICH-10 Detached:** repeat Appearance open/edit/save/cancel in a detached window and verify no cross-window exception.
- **M10-RICH-11 Render protection:** while dirty, trigger unrelated Actor and embedded Item updates; verify the editor and unsaved content remain. Save or cancel, then verify normal hook rendering resumes.
- **M10-RICH-12..14 State/permissions:** reopen after save, try opening a second field while one is active (it must remain closed), and verify Limited users have no controls and a synthetic invalid action cannot update the Actor.
- **M10-REG-01 Tabs:** click Character through PFS and verify native tabs have no errors and PFS remains a placeholder.
- **M10-REG-02 Proficiencies:** Intimidation Expert→Master updates source rank, prepared modifier/DC, and subsequent roll.
- **M10-REG-03 Spell slots:** edit value/max and verify persistence.
- **M10-REG-04 Crafting:** test formula quantity and daily crafting/reset.
- **M10-REG-05 Effects:** test Condition +/-, Effect counter, Affliction stage, persistent recovery, and supported drops.

## Milestone 11 – PFS / Organized Play

- **M11-PFS-01 Empty:** open a character without PFS numbers/boons; verify fields, clean boon empty state, and no console error.
- **M11-PFS-02 Player Number:** enter a valid Player Number, reload, and verify persistence.
- **M11-PFS-03 Character Number:** enter a valid Character Number and verify persistence.
- **M11-PFS-04 Invalid Number:** try below/above range and non-numeric values; verify restore/no mutation; clear each field and verify persisted `null`.
- **M11-PFS-05 Level Bump:** toggle on/off; verify only source flag changes directly and Core preparation changes/restores relevant modifiers and HP.
- **M11-PFS-06 Current Faction:** change faction and reload.
- **M11-PFS-07 Reputation:** edit two factions, reload, then clear one and verify `null`.
- **M11-PFS-08 Boon Rendering:** verify a PFS Boon appears in PFS from `actor.pfsBoons` and is not incorrectly grouped as a normal feat.
- **M11-PFS-09 Open Boon:** open its real embedded Feat sheet.
- **M11-PFS-10 Chat Boon:** send through PF2e Item chat.
- **M11-PFS-11 Delete Boon:** delete a free boon and verify embedded deletion/prepared-list refresh; verify a granted boon has no delete control.
- **M11-PFS-12 Browse:** verify PF2e Feat Browser category `pfsboon` and max level equal to Actor level.
- **M11-PFS-13 PFS Boon Drop:** drop a Compendium, world, and other-Actor genuine PFS Boon and verify correct embedding.
- **M11-PFS-14 Wrong Feat Drop:** drop normal Skill/Class/General Feats; verify no-op and no category rewrite.
- **M11-PFS-15 Same Actor Drop:** drag an existing boon back onto its own PFS tab; verify no duplicate.
- **M11-PFS-16 Observer:** verify data remains visible but inputs and mutation/delete/add controls are absent or disabled; test permitted Open/Chat.
- **M11-PFS-17 Detached:** detach, then edit numbers/faction/reputation, toggle level bump, open/chat a boon, browse, and drop; verify no cross-window errors.
- **M11-PFS-18 Tab Root:** inspect the PFS listener root; it is `SECTION.tab-panel`, not `BUTTON[data-action="tab"]`, including when initially inactive.
- **M11-REG-01 Biography:** edit/save/cancel rich text and verify the local ProseMirror lifecycle.
- **M11-REG-02 Proficiencies:** change Intimidation Expert→Master and verify prepared rank, modifier, DC, and a subsequent roll.
- **M11-REG-03 Spellcasting:** edit slot value/max and verify persistence.
- **M11-REG-04 Crafting:** edit formula quantity and exercise daily crafting/reset.
- **M11-REG-05 Effects:** exercise Condition +/-, Effect counter, Persistent Damage recovery, and supported drop.
- **M11-REG-06 Native tabs:** navigate all primary tabs before/after Actor updates and in a detached window.

## Milestone 11 final parity fix

- **M11-FIX-01 – Read-only Browse:** Open PFS as an Observer/non-editable user. Confirm Browse PFS Boons is visible, opens the PF2e Feat Browser with category `pfsboon` and maximum level equal to Actor level, and causes no Actor mutation. Confirm number, level-bump, faction, reputation, Boon delete, and Boon drop/add controls remain unavailable or rejected.
- **M11-FIX-02 – Inventory summary:** Expand an Inventory Item and confirm PF2e-enriched final description HTML, UUID links, applicable inline syntax, and no console errors.
- **M11-FIX-03 – Feat summary:** Expand a Feat and confirm its PF2e-aware final description.
- **M11-FIX-04 – PFS Boon summary:** Expand a PFS Boon and compare the description with the official PF2e Item summary.
- **M11-FIX-05 – Effects summary:** Expand Effects, Conditions, and Afflictions and confirm no summary regression.
- **M11-FIX-06 – Alterations/addenda:** Use an Item whose description is changed by a PF2e description alteration or addendum. Confirm the summary shows the final Core-rendered text rather than only `system.description.value`, with Owner/Observer secrets and GM notes matching Core.

## Milestone 12 – UI / Layout / Theme System

- **M12-UI-01 Remaster:** Select Remaster, open every tab, and verify readable controls and intact layouts.
- **M12-UI-02 Classic:** Select Classic and repeat the all-tab readability/layout pass.
- **M12-UI-03 Dark:** Select Dark and verify contrast, disabled states, summaries, and editor surfaces in every tab.
- **M12-UI-04 Compact:** Select Compact; verify shorter rows/gaps/controls and that every control remains reachable.
- **M12-UI-05 Comfortable:** Select Comfortable and verify the default spacing across every tab.
- **M12-UI-06 Narrow:** Resize to roughly 520–600px; verify usable scrolling navigation, collapsed grids, wrapping controls, and no horizontal layout explosion.
- **M12-UI-07 Medium:** Resize to roughly 720–900px and verify appropriate one/two-column grids.
- **M12-UI-08 Wide:** Resize to 1000px or wider and verify balanced multi-column layouts.
- **M12-UI-09 Detached:** Detach the sheet, change theme and density, and verify scoped live updates and responsive layout.
- **M12-UI-10 Tabs:** Visit Character, Actions, Inventory, Spellcasting, Crafting, Proficiencies, Feats, Effects, Biography, and PFS via native tabs.
- **M12-UI-11 Inventory:** Recheck quantity, carry state, invested state, drag/drop, and item summaries.
- **M12-UI-12 Actions:** Recheck strikes, all MAP buttons, damage, critical damage, auxiliary actions, and ammunition.
- **M12-UI-13 Spellcasting:** Recheck casting, slot value/max edits, preparation, expenditure, and drag/drop.
- **M12-UI-14 Crafting:** Recheck formula quantity, daily crafting, reset, preparation, and crafting actions.
- **M12-UI-15 Proficiencies:** Change Intimidation from Expert to Master and verify source rank, modifier, and DC update.
- **M12-UI-16 Biography:** Recheck rich-text Edit, Save, Cancel, and visibility without editor clipping.
- **M12-UI-17 Effects:** Recheck condition +/- controls, counters, persistent-damage recovery, affliction stages, and drops.
- **M12-UI-18 PFS:** Recheck player/character numbers, level bump, faction, reputation, boon browser, summaries, and boon controls.

## Milestone 12 – Visual Polish Pass 1

- **M12-POLISH-01 – Character Name:** Open characters named “Lim Richward”, “Ramona Tehvers”, and “A Very Long Character Name”. Confirm capitals/serifs are not vertically clipped, the field has balanced vertical space, and portrait, name, level, HP, and AC remain responsive around 520–600px.
- **M12-POLISH-02 – Remaster Headings:** In Remaster, confirm Perception, Saves, Skills, Inventory, and Coins are clearly readable on parchment, with major, subsection, and column-label hierarchy intact.
- **M12-POLISH-03 – Classic Headings:** Repeat the heading contrast and hierarchy check in Classic.
- **M12-POLISH-04 – Dark Headings:** Repeat the heading contrast and hierarchy check in Dark; headings must use the light theme value.
- **M12-POLISH-05 – Currency Labels:** Open Inventory and confirm Platinum, Gold, Silver, and Copper are localized; no visible `PF2E.Currency.*` key remains.
- **M12-POLISH-06 – Bulk:** Confirm the Inventory overview displays a readable prepared PF2e Bulk value and maximum, never `[object Object]`.
- **M12-POLISH-07 – Coin Controls:** Exercise PP/GP/SP/CP add and remove controls and confirm values update as before.
- **M12-POLISH-08 – Icon Controls:** Confirm quantity +/−, summary/chat, edit, delete, visibility/identification, invest, consume, container, and create controls are compact, keyboard-focusable, labelled, and clickable.
- **M12-POLISH-09 – Carry Controls:** Exercise Held 1H, Held 2H, Worn, Stowed, and Dropped; confirm labels remain readable, controls wrap without overlap, and state updates.
- **M12-POLISH-10 – Compact Density:** Compare Comfortable and Compact. Confirm icon-only controls reduce sensibly while carry-state text buttons remain readable.
- **M12-POLISH-11 – Detached:** In a detached window, repeat header checks at 520–600px and Inventory checks at narrow and 720–900px widths. Recheck quantity, carry, invest, summary, edit, delete, drag/drop, and coins; then verify Intimidation Expert→Master updates source rank/modifier/DC, Biography Edit/Save/Cancel still works, and Actions, Spellcasting, Crafting, Effects, and PFS show no obvious regression.

## Milestone 12.1 – Runtime presentation and Character dashboard

- **M12.1-FINAL-01 – Initial Theme Application:** Set Theme to Dark and Density to Compact while the sheet is closed. Open it and verify the FORM root has `data-theme="dark"` and `data-density="compact"`, the Dark theme is visible immediately, and no world reload is needed.
- **M12.1-FINAL-02 – Live Theme Change:** With the sheet open, change Dark→Remaster→Classic and verify the UI updates immediately after each change.
- **M12.1-FINAL-03 – Live Density Change:** With the sheet open, change Comfortable→Compact and verify row heights and controls update immediately.
- **M12.1-FINAL-04 – Reopen:** Set Theme to Classic, close the sheet, reopen it, and verify Classic remains active on first render.
- **M12.1-FINAL-05 – Detached:** Detach the sheet, change Theme, and verify the detached sheet updates without a cross-window error.
- **M12.1-FINAL-06 – Shield BT Label:** Open a character with a held shield and verify Hardness, HP, and the localized Shield Broken Threshold label appear; `PF2E.Item.Shield.BrokenThreshold.Label` must not be visible.
- **M12.1-FINAL-07 – Perception:** Verify the Perception heading is fully visible and no glyphs are clipped.
- **M12.1-FINAL-08 – Regression:** Smoke-test Inventory, Proficiencies, Biography, Spellcasting, Crafting, Effects, and PFS for obvious regressions.

- **M12.1-THEME-01:** Set Dark and Compact, open the sheet for the first time, and verify the FORM root has `data-theme="dark"` and `data-density="compact"` and is visibly dark.
- **M12.1-THEME-02:** With the sheet open, change Remaster→Classic→Dark and Comfortable→Compact; verify each is immediately visible without a world reload.
- **M12.1-THEME-03:** Close the sheet, change both settings, reopen, and verify the new values are applied on first render.
- **M12.1-THEME-04:** Detach, change theme/density, and verify the detached root updates without leaking attributes to `body` or `html`.
- **M12.1-UI-01:** Open Character and verify Perception glyphs are fully visible while Saves and Skills remain unchanged.
- **M12.1-INV-01:** Verify Weapons and Shields, Armor, Equipment, Consumables, Ammunition, Treasure, and Containers use the same localized labels as Core; no section heading is the generic Item column label.
- **M12.1-ATTR-01:** Compare all six displayed modifiers with the official PF2e sheet.
- **M12.1-ATTR-02:** As an owner, use Attributes Edit; verify the official Core sheet opens and its Attribute Builder remains the mutation owner (public direct integration is unavailable).
- **M12.1-SPEED-01:** Compare land speed and all present fly/swim/climb/burrow speeds with Core prepared values.
- **M12.1-SHIELD-01:** Without a held shield, verify AC remains correct and no shield-detail block appears.
- **M12.1-SHIELD-02:** Hold a shield and compare Hardness, current/max HP, and BT with Core.
- **M12.1-SHIELD-03:** Raise the held shield and verify Raised appears from prepared state.
- **M12.1-SHIELD-04:** Break the held shield and verify Broken appears from prepared state.
- **M12.1-LANG-01:** Compare every displayed language and localized label with Core.
- **M12.1-LANG-02:** As an owner, use Languages Edit and verify the official sheet opens for its Core-owned selector.
- **M12.1-LANG-03:** In Core's selector, change a freely selected language and verify source persistence while an item/rule-granted language remains protected.
- **M12.1-RESP-01:** At wide, medium, and narrow detached widths verify attribute grids collapse 6→3→2 columns and combat/shield/language content remains reachable.
- **M12.1-REG-01:** Change Intimidation Expert→Master and verify source rank, prepared modifier, DC, and roll.
- **M12.1-REG-02:** Recheck Inventory quantity, carry, invest, summary, drag/drop, and coins.
- **M12.1-REG-03:** Recheck Biography Rich Text Edit, Save, and Cancel.
- **M12.1-REG-04:** Smoke-test Spellcasting, Crafting, Effects, and PFS, then navigate every native primary tab.

## Milestone 12.2 – Spellcasting contrast and Focus Pool parity

- **M12.2-SPELL-01 – Remaster Contrast:** Open Spellcasting in Remaster and verify Vessel Spells, Focus Spells, Wand of Harm (Level 1), Attack +12, and DC 22 are clearly readable.
- **M12.2-SPELL-02 – Classic Contrast:** Repeat the Spellcasting heading and Attack/DC readability check in Classic.
- **M12.2-SPELL-03 – Dark Contrast:** Repeat the Spellcasting heading and Attack/DC readability check in Dark.
- **M12.2-SPELL-04 – Focus Pool:** Open an Actor with a Focus Pool; verify its Focus section uses point pips rather than Slots and current/max matches PF2e Core.
- **M12.2-SPELL-05 – Normal Slots:** Verify prepared, spontaneous, innate, and item Spellcasting entries retain their normal slot/uses presentation and behavior.
- **M12.2-SPELL-06 – No Focus Pool:** Open an Actor with no Focus Pool or Focus Spells; verify no broken display and no Focus `Slots: 0 / 0` fallback.
- **M12.2-SPELL-07 – Compact Density:** In Compact density, verify Focus pips and Spellcasting headers remain readable and do not overlap.
- **M12.2-SPELL-08 – Detached:** In a detached Spellcasting tab, verify theme contrast, Focus Pool presentation, controls, and layout remain correct.

## Milestone 12.3 – Inventory hierarchy, shield defense, and Perception layout

- **M12.3-SHIELD-01 – No Shield:** Open a character without a Core-recognized held shield. Verify the header still shows AC, the Character tab has no second AC card, and no empty defense panel or invented shield HP, Hardness, or BT appears.
- **M12.3-SHIELD-02 – Held Shield:** Open a character whose shield is held and recognized by PF2e Core. Verify Defense shows its name, Hardness, current/max HP, and Broken Threshold, with values matching the official PF2e sheet.
- **M12.3-SHIELD-03 – Raised:** Raise the held shield and verify the prepared Raised state is visible.
- **M12.3-SHIELD-04 – Broken:** Reduce the shield below BT, or use an appropriate prepared test state, and verify Broken is visible.
- **M12.3-SHIELD-05 – Destroyed:** Where Core exposes the prepared state, destroy the held shield and verify Destroyed is visible.
- **M12.3-INV-01 – Section Hierarchy:** Use a character with Weapons & Shields, Armor, and Equipment. Verify each real category heading is prominent, the `Item` column heading remains below it, and `Item` cannot be mistaken for the category name.
- **M12.3-INV-02 – Remaster Contrast:** In Remaster, verify all populated and empty inventory section headings are clearly readable.
- **M12.3-INV-03 – Classic Contrast:** Repeat the inventory section-heading contrast check in Classic.
- **M12.3-INV-04 – Dark Contrast:** Repeat the inventory section-heading contrast check in Dark.
- **M12.3-UI-01 – Perception Flow:** Open Character and verify the Perception heading is fully visible, is not clipped or outside its section, and has normal spacing after the preceding dashboard section.
- **M12.3-RESP-01 – Narrow:** At widths from approximately 520–700 px, verify shield details wrap cleanly, inventory headings remain visible, visible column headings do not overlap, and Perception remains in normal flow.
- **M12.3-DETACH-01 – Detached:** Repeat the shield, inventory hierarchy, and Perception checks in a detached/pop-out sheet.
- **M12.3-REG-01 – Presentation:** Change Remaster→Classic→Dark and Comfortable→Compact and verify the sheet-local theme and density still update immediately; recheck Spellcasting Focus Pool contrast and pips.
- **M12.3-REG-02 – Inventory:** Recheck quantity, uses, carry type, invest, containers, drag/drop, coins, summary, delete, and transfer behavior.
- **M12.3-REG-03 – Proficiencies/Biography:** Change Intimidation Expert→Master and verify rank, modifier, and DC update; then verify Biography Edit, Save, and Cancel.
- **M12.3-REG-04 – Other Tabs:** Smoke-test Actions, Crafting, Effects, and PFS.

## Milestone 12.4 – Focus interaction and Perception header

- **M12.4-FOCUS-01 – Left click:** With Focus 1/3, left-click the Focus Pool twice and verify 2/3 then 3/3. Click again and verify PF2e Core prevents an invalid value without module-side clamping.
- **M12.4-FOCUS-02 – Right click:** With Focus 2/3, right-click twice and verify 1/3 then 0/3. Right-click again and verify Core resource semantics prevent an invalid value.
- **M12.4-FOCUS-03 – Context menu:** Right-click the Focus Pool and verify the resource decreases without a browser or Foundry context menu.
- **M12.4-FOCUS-04 – Permission:** As an Observer/non-editor, verify the Focus Pool remains visible but click and contextmenu cause no mutation.
- **M12.4-FOCUS-05 – Cast:** Cast a Focus Spell and verify PF2e consumes the Focus Point and the rerendered pips reflect it.
- **M12.4-FOCUS-06 – Manual add after cast:** After casting, left-click the Focus Pool and verify it increases through the Core resource API.
- **M12.4-FOCUS-07 – Focus cantrip:** Verify the Focus Cantrip group displays `∞ / ∞`, consumes no normal Focus Point, and never displays Focus pips; verify the Focus Spell group retains pips and normal spell groups retain slot counters.
- **M12.4-FOCUS-08 – Detached:** In a detached sheet, verify Focus left-click +1 and right-click -1 work without cross-window errors.
- **M12.4-PERCEPTION-01 – Heading:** Open Character and verify the Perception heading is fully visible in normal flow, outside the rollable button, with no clipped glyphs.
- **M12.4-PERCEPTION-02 – Roll:** Click the Perception statistic row and verify a real PF2e Perception roll.
- **M12.4-PERCEPTION-03 – Secret:** Use Secret Perception and verify the existing secret-roll flow remains intact.

## Milestone 13 – Persistent Sidebar / Core Resources

- **M13-SIDEBAR-01 – Default:** With fresh client settings, open a character and confirm `showSidebar = true` and the sidebar is visible.
- **M13-SIDEBAR-02 – Toggle Off:** Disable the setting; confirm every open console updates immediately, the sidebar disappears, and content uses the full width.
- **M13-SIDEBAR-03 – Toggle On:** Enable it again and confirm the sidebar immediately returns without a world reload.
- **M13-SIDEBAR-04 – All Tabs:** Visit Character, Actions, Inventory, Spellcasting, Crafting, Proficiencies, Feats, Effects, Biography, and PFS; the sidebar remains visible.
- **M13-HP-01 – Edit Current HP:** As an owner, edit current HP; confirm Actor source updates and persists after reload.
- **M13-HP-02 – Enter:** Change HP and press Enter; confirm no form submission and a correct update.
- **M13-HP-03 – Escape:** Change HP and press Escape; confirm the persisted rendered value is restored and no change is sent.
- **M13-HP-04 – Observer:** Confirm HP is visible as text and cannot be edited.
- **M13-HERO-01 – Display:** Compare Hero Point current/max with PF2e core.
- **M13-HERO-02 – Left Click:** At 1/3, left-click and confirm 2/3 through the core resource API.
- **M13-HERO-03 – Right Click:** At 2/3, right-click and confirm 1/3 with no context menu.
- **M13-HERO-04 – Bounds:** Click at maximum and right-click at zero; confirm PF2e core controls bounds.
- **M13-HERO-05 – Observer:** Confirm an observer cannot mutate Hero Points.
- **M13-HERO-06 – Mythic:** Confirm a character whose prepared Hero Point maximum is zero has no false Hero Point display.
- **M13-PERCEPTION-01:** Click sidebar Perception and confirm a genuine PF2e statistic roll.
- **M13-SAVES-01:** Roll Fortitude, Reflex, and Will from the sidebar.
- **M13-INIT-01:** Compare initiative statistic/modifier with the official sheet and test the core initiative roll.
- **M13-SHIELD-01:** With a held shield, compare name, hardness, HP, BT, and raised/broken/destroyed state.
- **M13-SHIELD-02:** With no held shield, confirm no empty shield block.
- **M13-RESP-01 – Narrow:** Resize a detached sheet narrowly; confirm the sidebar becomes a usable two-column resource band without horizontal scrolling.
- **M13-RESP-02 – Wide:** Confirm the sidebar is left of the tab navigation/content.
- **M13-THEME-01:** Check Remaster, Classic, and Dark readability.
- **M13-DENSITY-01:** Check comfortable and compact spacing.
- **M13-REGRESSION-01:** Recheck Character attributes/speeds/languages, Inventory coins/quantity/carry/drag/drop/summaries, Focus display/adjust/cast consumption, proficiency rank updates, and Biography edit/save/cancel.

## Milestone 13.1 – Sidebar parity pass

- **M13.1-DYING-01:** With Dying greater than zero, confirm the sidebar pips match the Core-prepared state.
- **M13.1-WOUNDED-01:** With Wounded greater than zero, confirm the sidebar pips match the Core-prepared state.
- **M13.1-DYING-02:** Change Dying/Wounded through the official PF2e condition UI and confirm existing Actor/Item hooks refresh the sidebar.
- **M13.1-IWR-01:** Add an Immunity and confirm its Core label appears.
- **M13.1-IWR-02:** Add a Weakness and confirm type and value are correct.
- **M13.1-IWR-03:** Add a Resistance and confirm type and value are correct.
- **M13.1-IWR-04:** Compare an IWR exception/special case with the official sheet, including resistance double-vs text.
- **M13.1-IWR-05:** With no IWR entries, confirm no empty IWR panels appear.
- **M13.1-RANK-01:** Confirm Fortitude rank uses the localized Core label (for example Master), never `R3`.
- **M13.1-RANK-02:** Confirm Reflex, Will, and Perception rank labels match the official sheet.
- **M13.1-HERO-UX-01:** As Observer, confirm Hero Points remain visible without pointer/hover affordance and left/right clicks produce neither notification nor mutation.
- **M13.1-HERO-UX-02:** As Owner, confirm Hero Points left-click +1 and right-click -1 remain functional.
- **M13.1-RESP-01:** With long IWR labels, confirm tags wrap without horizontal layout breakage in both densities.
- **M13.1-DETACHED-01:** In a detached sheet, confirm Dying, Wounded, IWR, and rank badges render correctly.

## Milestone 13.2 – Application V2 resize and responsive overflow

- **M13.2-RESIZE-01 – Native Resize:** Open a docked sheet and drag Foundry's bottom-right resize handle. Confirm both width and height change and the sheet does not move instead.
- **M13.2-RESIZE-02 – Grow:** Make the sheet substantially wider and taller. Confirm content uses the added space and no artificial maximum width stops growth.
- **M13.2-RESIZE-03 – Shrink:** Make the sheet smaller. Confirm responsive layout activates and no massive horizontal scrollbar appears.
- **M13.2-RESIZE-04 – Detached Browser:** Detach the sheet and enlarge the separate browser window. Confirm the sheet layout grows with it and main content uses the new viewport.
- **M13.2-RESIZE-05 – Detached Narrow:** Narrow the detached browser window. Confirm responsive breakpoints activate, the sidebar adapts, and the previous docked width is not retained as a fixed layout width.
- **M13.2-PROF-01 – Wide:** At a wide sheet size, confirm every Proficiencies card and rank control remains inside its border.
- **M13.2-PROF-02 – Medium:** With the sidebar enabled at a medium width, confirm no Proficiencies control protrudes through the right edge of its card.
- **M13.2-PROF-03 – Narrow:** At a narrow width, confirm the rank selector reflows to another row and no unusable horizontal scrollbar appears.
- **M13.2-SIDEBAR-01:** Toggle `showSidebar` true and false at several sizes. Confirm both layouts remain natively resizable.
- **M13.2-OVERFLOW-01:** At wide, medium, and narrow sizes, smoke-test Inventory, Actions, Spellcasting, Crafting, Feats, Effects, Biography, and PFS for horizontal overflow.
- **M13.2-REGRESSION-01:** Recheck Remaster, Classic, and Dark themes plus Comfortable and Compact densities; verify HP and Hero Point controls, Focus left-click +1/right-click -1, and shield display.
- **M13.2-REGRESSION-02:** Change Intimidation from Expert to Master and confirm persisted rank, modifier, and DC update; then verify Biography Edit, Save, and Cancel.

## Milestone 13.3 – Sidebar and compact lists

- **M13.3-SIDEBAR-01 – Perception Badge:** Show a Perception rank and confirm its badge does not overlap Initiative and the modifier remains readable.
- **M13.3-SIDEBAR-02 – Saves Badge:** Show Fortitude, Reflex, and Will ranks and confirm no badge overlaps the next save and every modifier remains readable.
- **M13.3-SIDEBAR-03 – Weaknesses:** Add weaknesses and confirm compact PF2e-Core labels appear without an empty oversized section.
- **M13.3-SIDEBAR-04 – Resistances:** Add resistances and confirm their compact labels match PF2e Core.
- **M13.3-SIDEBAR-05 – Long IWR:** Use long immunity, weakness, and resistance labels; confirm wrapping without horizontal sidebar scrolling.
- **M13.3-INV-01 – Compact Inventory:** Open Inventory and confirm thumbnails, controls, and rows are smaller but remain legible and clickable.
- **M13.3-INV-02 – Coins:** Add and remove each denomination and confirm the compact fields and controls preserve coin behavior.
- **M13.3-INV-03 – Carry State:** Exercise held (one/two hands), worn, stowed, and dropped controls; confirm the compact group remains fully functional.
- **M13.3-SPELL-01 – Compact Spell List:** Confirm spell thumbnails, Cast/utility controls, traits, and rows are visibly denser and remain usable.
- **M13.3-SPELL-02 – Focus / Known / Rituals:** Inspect all available spell groups and confirm headers remain compact with no collisions.
- **M13.3-SPELL-03 – Functionality:** Recheck cast, slot edits, Focus adjustment, prepare/unprepare, expend, summary, chat, and drag/drop with no regression.
- **M13.3-DETACHED-01:** In a detached sheet at wide, medium, and narrow widths, confirm Sidebar, Inventory, and Spellcasting wrap without collisions or horizontal overflow.
- **M13.3-THEME-01:** Repeat the visual checks in Classic, Remaster, and Dark and confirm badges, text, rows, and controls remain readable.
- **M13.3-DENSITY-01:** Repeat in Comfortable and Compact and confirm no overlap and no unusably small controls.

## Milestone 13.4 – Sidebar stat rows and compact spell traits

- **M13.4-SIDEBAR-01 – Perception:** With a Perception rank badge, confirm the badge is fully readable, does not overlap Initiative, and the modifier remains right-aligned.
- **M13.4-SIDEBAR-02 – Initiative:** Use a secondary initiative statistic such as Occultism and confirm it stays in Initiative's meta row without overlapping Perception or saves.
- **M13.4-SIDEBAR-03 – Saves:** Confirm Fortitude, Reflex, and Will rank badges are visible, modifiers align right, and no save overlaps the following row.
- **M13.4-SIDEBAR-04 – Compact Density:** In Compact density, confirm all sidebar stat rows remain readable without badge overlaps.
- **M13.4-SPELL-01 – Many Traits:** Inspect a spell with at least five traits; confirm only three traits are directly visible, the remainder appears as `+N`, and the row is visibly flatter.
- **M13.4-SPELL-02 – +N Tooltip:** Hover `+N` and confirm every hidden trait appears in its original order with no information loss.
- **M13.4-SPELL-03 – Few Traits:** Inspect spells with one or two traits and confirm all are visible with no unnecessary overflow chip.
- **M13.4-SPELL-04 – Exact Limit:** Inspect a spell with exactly three traits and confirm all three are visible with no `+N`.
- **M13.4-SPELL-05 – Accessibility:** Inspect `+N` with accessibility tooling and confirm its localized accessible label includes the count and every hidden trait, while its tooltip text is correct.
- **M13.4-SPELL-06 – Narrow:** In a narrow detached window, confirm spell names remain readable, traits move below the name compactly, controls remain reachable, and no horizontal scrollbar appears.
- **M13.4-SPELL-07 – Functionality:** Recheck Cast, Focus adjustment, slot editing, Summary, prepare/unprepare, expend, chat, and drag/drop with no regression.

## Milestone 14 – Ornamental theme pass

- **M14-ORN-01 – Off:** Set `ornamentation` to Off. Confirm no additional decorative elements appear and the functional layout is unchanged.
- **M14-ORN-02 – Subtle:** Confirm header corners, the refined sidebar frame, decorative section dividers, and minimal card accents are visible without visual overload.
- **M14-ORN-03 – Ornate:** Confirm stronger but controlled double/inset framing and corner details do not overlap content or controls.
- **M14-ORN-04 – Remaster:** Test Subtle and Ornate in Remaster; confirm bronze, muted gold, forest green, and warm natural tones remain readable.
- **M14-ORN-05 – Classic:** Test Subtle and Ornate in Classic; confirm brass/gold, burgundy, red-brown, and parchment remain readable.
- **M14-ORN-06 – Dark:** Test Subtle and Ornate in Dark; confirm desaturated brass, dark metal, and restrained green/gold glow remain readable.
- **M14-ORN-07 – Sidebar:** Inspect Vitals, Defense, Checks, Saving Throws, Immunities, Weaknesses, and Resistances. Confirm dividers are clean, text is unobscured, and stat rows are unchanged.
- **M14-ORN-08 – Tabs:** Switch through every tab. Confirm decoration remains stable and active, hover, and inactive hierarchy is clear.
- **M14-ORN-09 – Detached:** Detach the sheet. Confirm ornaments remain visible, create no overflow, and leave the native resize handle usable.
- **M14-ORN-10 – Resize:** Resize the sheet larger and smaller. Confirm corners and dividers reduce cleanly without shifting or blocking content.
- **M14-ORN-11 – Compact Density:** Repeat the ornament checks in Compact density and confirm no collisions.

## Milestone 14.1 – Sidebar resource and icon polish

- **M14.1-HP-01 – HP Bar:** Use a character with 144 / 176 HP. Confirm both numbers are correct and the bar is filled to approximately the same proportion.
- **M14.1-HP-02 – HP Edit:** Edit current HP and confirm the number and bar update after the Actor render.
- **M14.1-HP-03 – Zero HP:** Set HP to zero and confirm the bar is empty with no negative width.
- **M14.1-HP-04 – Full HP:** Set current HP equal to maximum HP and confirm the bar is 100% full.
- **M14.1-AC-01:** Confirm the AC row displays a distinct blue shield icon, independently of the held-shield summary.
- **M14.1-PERCEPTION-01:** Confirm the eye icon and unchanged rank badge are visible and the whole Perception row still rolls.
- **M14.1-INIT-01:** Confirm the initiative icon and secondary statistic are visible and the row still rolls initiative.
- **M14.1-SAVES-01:** Confirm Fortitude, Reflex, and Will each have the appropriate icon, clean badge and modifier alignment, and remain rollable.
- **M14.1-THEME-01:** In Remaster, Classic, and Dark, confirm the HP bar, blue AC shield, and stat icons are readable.
- **M14.1-DENSITY-01:** In Comfortable and Compact, confirm no overlap, a visible HP bar, and uncramped icons.
- **M14.1-ORNAMENT-01:** With ornamentation Off, Subtle, and Ornate, confirm icons remain informational and unobstructed.
- **M14.1-DETACHED-01:** In a detached sheet, confirm the HP bar, icons, and stat rows render cleanly at wide and narrow sizes.

## Milestone 14.3 – Character identity and segmented XP

- **M14.3-DEITY-01 – Character with Deity:** Open a character with a deity. Confirm its prepared name is visible and no deity rules are reproduced locally.
- **M14.3-DEITY-02 – No Deity:** Open a character without a deity. Confirm an em dash is shown, the layout remains clean, and no JavaScript error occurs.
- **M14.3-XP-01 – Zero XP:** Use 0 / max XP. Confirm all ten segments are empty and the numbers are correct.
- **M14.3-XP-02 – Partial XP:** Use 735 / 1000 XP. Confirm seven segments are full, the eighth is 35% filled, the remainder are empty, and the numbers are correct.
- **M14.3-XP-03 – Full XP:** Use max / max XP. Confirm all ten segments are full.
- **M14.3-XP-04 – Non-1000 Max:** Use a Core/system state with another XP maximum. Confirm the display uses prepared `max` and `pct` without a 1000-XP assumption.
- **M14.3-XP-05 – Over/Invalid Presentation Safety:** Exercise an out-of-range percentage if possible. Confirm visual fill is clamped to 0–100 while Core data is not changed.
- **M14.3-XP-06 – Themes:** Check Remaster, Classic, and Dark. Confirm the track, border, fill, text, and numeric value remain legible with sufficient contrast.
- **M14.3-XP-07 – Ornamentation:** Check Off, Subtle, and Ornate. Confirm their simple, highlighted, and inset segment treatments create no layout issue.
- **M14.3-XP-08 – Compact Density:** Confirm all ten segments remain visible in Compact density.
- **M14.3-XP-09 – Detached:** Detach the Character tab and test wide, medium, and narrow sizes. Confirm deity and XP remain visible without horizontal overflow.

## M14.4 – Full Prepared Spell Management UI

### M14.4-PREPUI-01 – Button Visibility
Open Spellcasting for an editable, prepared, non-flexible entry. Verify the labeled **Prepare Spells** button is visible in its entry header.

### M14.4-PREPUI-02 – No Button for Spontaneous
Open an editable spontaneous entry. Verify no **Prepare Spells** button appears.

### M14.4-PREPUI-03 – No Button for Flexible Prepared
Open an editable flexible-prepared entry. Verify no classic preparation button or manager is offered.

### M14.4-PREPUI-04 – Open Manager
Click **Prepare Spells**. Verify the resizable Application V2 manager opens and remains usable.

### M14.4-PREPUI-05 – Known Spells
Verify known spells come from the selected entry, are grouped under Cantrips/Rank headings, and show compact icons, ranks, and traits.

### M14.4-PREPUI-06 – Empty Slots
Verify every empty classic prepared slot is visible and has a labeled Prepare action.

### M14.4-PREPUI-07 – Prepare from Known Spell
Click Prepare beside a known spell, choose one of the offered valid slots, and verify both manager and main sheet update.

### M14.4-PREPUI-08 – Prepare from Empty Slot
Click Prepare on an empty slot. Verify only eligible known spells are offered and the selected spell is prepared through Core.

### M14.4-PREPUI-09 – Unprepare
Unprepare an occupied slot. Verify the slot becomes empty while the spell remains in Known Spells.

### M14.4-PREPUI-10 – Swap
Drag one prepared slot onto another slot in the same rank. Verify Core `swapSlotPositions(...)` is called and the order persists.

### M14.4-PREPUI-11 – Expended Spell
Open a manager containing an expended slot. Verify it remains occupied and is visually labeled Expended rather than Empty.

### M14.4-PREPUI-12 – Cantrips
Prepare, unprepare, and swap prepared cantrips. Verify Core accepts the operations and non-cantrips are never offered to cantrip slots.

### M14.4-PREPUI-13 – Higher Rank
Choose a lower-rank known spell for a higher-rank slot. Verify it is offered only on the Core-compatible rank path and Core remains the final validator.

### M14.4-PREPUI-14 – Read-only Actor
Open the same Actor as a user without update permission. Verify the sheet remains readable and has no preparation button or mutation controls/D&D.

### M14.4-PREPUI-15 – Detached
Detach the character sheet, open the manager, and exercise prepare, unprepare, and swap. Verify no main-window DOM dependency or cross-window error.

### M14.4-PREPUI-16 – Themes
Exercise the manager in Remaster, Classic, and Dark with ornamentation Off, Subtle, and Ornate. Verify readable tokens and controls.

### M14.4-PREPUI-17 – Compact
Resize the manager narrowly and test both density settings. Verify the two panes stack, rows stay compact, and no horizontal scrollbar or collision is normal.

## M15 Restart – Isolated GM Character Console

- **GM-RESTART-01 – Player Sheet Baseline:** Before opening the console, open the normal V2 player sheet and verify it is visually and functionally identical to the pre-M15 baseline.
- **GM-RESTART-02 – GM-only:** As a player, verify there is no scene-control entry point and `openGMConsole()` is blocked with a notification.
- **GM-RESTART-03 – Open Console:** As a GM, open the console from Token scene controls and through the module API; verify repeated opens focus one instance.
- **GM-RESTART-04 – Discovery:** Verify only character Actors owned by at least one non-GM user are initially selected.
- **GM-RESTART-05 – Selector:** Select and deselect Actors, apply the selection, and verify the panes match.
- **GM-RESTART-06 – Empty Selection:** Deselect all Actors, close and reopen the console, and verify the selection remains empty.
- **GM-RESTART-07 – HP:** Change HP in one pane and verify the correct Actor is updated through PF2e prepared data.
- **GM-RESTART-08 – Hero Points:** Change Hero Points and verify the correct PF2e resource is updated and bounded.
- **GM-RESTART-09 – Perception:** Roll Perception from a pane and verify PF2e Core performs the roll.
- **GM-RESTART-10 – Saves:** Roll Fortitude, Reflex, and Will from each pane and verify PF2e Core performs each roll.
- **GM-RESTART-11 – Initiative:** Roll initiative and verify PF2e Core performs the roll for the pane Actor.
- **GM-RESTART-12 – Open Player Sheet:** Click **Open V2 Sheet** and verify the existing normal V2 sheet opens with unchanged functionality.
- **GM-RESTART-13 – Actor Isolation:** Change Actor A's HP and verify Actor B remains unchanged.
- **GM-RESTART-14 – Targeted Refresh:** Update Actor A externally and verify only Actor A's GM pane is replaced.
- **GM-RESTART-15 – Player Sheet Regression:** After using the console, execute the complete existing player-sheet manual suite and verify no regression.

## M15 Restart Hotfix – Foundry V14 and Core-owned resources

- **GM-HOTFIX-01 – Scene Control Visible:** As a GM, open Token controls and verify the GM Character Console tool is visible.
- **GM-HOTFIX-02 – Scene Control Opens Console:** Click the tool and verify the console opens without an exception and repeated clicks retain exactly one instance.
- **GM-HOTFIX-03 – Non-GM:** As a player, verify the tool is not visible and the direct module API remains blocked.
- **GM-HOTFIX-04 – HP Mutation:** Change HP and verify the correct Actor is updated and PF2e/Core accepts or clamps the raw value without a local minimum or maximum rule.
- **GM-HOTFIX-05 – Hero Points:** Left-click to add one Hero Point and right-click to subtract one; verify `updateResource("hero-points", ...)` is used and PF2e/Core handles the boundaries.
- **GM-HOTFIX-06 – Player Sheet Regression:** Open the normal V2 player sheet and verify it remains visually and functionally unchanged.

## M15.1 – GM pane polish, Focus Points, Conditions, and collapse

- **GM15.1-01 – Player Sheet Baseline:** Open the normal V2 sheet before and after using the GM Console; verify it remains unchanged.
- **GM15.1-02 – Collapse:** Collapse a pane and verify only its header and mini-status remain in the DOM.
- **GM15.1-03 – Expand:** Expand the pane and verify its complete summary returns.
- **GM15.1-04 – Collapse Persistence:** Collapse a pane, close the console, and reopen it; verify the state persists.
- **GM15.1-05 – Focus Display:** Use an Actor with a Focus pool and verify its filled and empty pips match the prepared resource.
- **GM15.1-06 – Focus +1:** Left-click Focus and verify `updateResource("focus", current + 1)` targets the correct Actor.
- **GM15.1-07 – Focus -1:** Right-click Focus and verify `updateResource("focus", current - 1)` targets the correct Actor and suppresses the browser context menu.
- **GM15.1-08 – Actor without Focus:** Use an Actor without a Focus pool and verify no empty Focus section appears.
- **GM15.1-09 – Conditions:** Apply Frightened, Prone, and Slowed and verify compact, read-only chips appear.
- **GM15.1-10 – Condition Value:** Apply Frightened 2 and verify the prepared Core condition name includes the correct value.
- **GM15.1-11 – Condition External Update:** Create, update, and delete a Condition externally; verify only its Actor pane refreshes.
- **GM15.1-12 – Multiple Actors:** Change Actor A's Focus and verify Actor B remains unchanged.
- **GM15.1-13 – Collapsed Targeted Refresh:** Collapse Actor A, change its HP externally, and verify its header mini-status refreshes without rendering the body.

## M15.2 – Isolated GM Inventory View

- **GM15.2-01 – Player Sheet Baseline:** Open the normal player sheet before and after using Inventory; verify it remains unchanged.
- **GM15.2-02 – Inventory Tab:** Set Actor A to Inventory and Actor B to Overview; verify the pane view states are independent.
- **GM15.2-03 – Inventory Sections:** Use a character with several physical item types; verify Core categories are correct and empty categories are absent.
- **GM15.2-04 – Quantity:** Change an item quantity; verify the correct owned item is updated through `system.quantity`.
- **GM15.2-05 – Carry State:** Change held, worn, stowed, and dropped states; verify PF2e `changeCarryType(...)` handles the correct Actor and item.
- **GM15.2-06 – Invested:** Toggle an investable item; verify PF2e `toggleInvested(...)` handles it.
- **GM15.2-07 – Item Summary:** Toggle a summary; verify the correct item's owner-aware Core description appears.
- **GM15.2-08 – Open Item:** Open an item and verify its normal PF2e item sheet appears.
- **GM15.2-09 – Coins:** Compare the read-only PP, GP, SP, and CP summary with PF2e's prepared inventory currency.
- **GM15.2-10 – Targeted Refresh:** Change Actor A's item externally; verify only Actor A's pane refreshes.
- **GM15.2-11 – Actor Isolation:** Change an Actor A quantity and verify Actor B remains unchanged.
- **GM15.2-12 – Collapsed:** Collapse Actor A with Inventory active; verify no navigation or inventory body is rendered.
- **GM15.2-13 – Read-only:** Inspect an Actor that cannot be edited; verify inventory information and item-sheet access remain while quantity, carry, and invested mutation controls are absent.

## M15.2.1 – GM Inventory carry-state, invested, and validation hotfix

- **GM15.2.1-01 – Held 1H:** Set an item to Held 1H; verify the GM UI shows Held 1H and PF2e Actor data has `carryType = held` and `handsHeld = 1`.
- **GM15.2.1-02 – Held 2H:** Set an item to Held 2H; verify the GM UI shows Held 2H and PF2e Actor data has `carryType = held` and `handsHeld = 2`.
- **GM15.2.1-03 – Existing 2H State:** Set an item to two-handed outside the GM Console, then open Inventory; verify it is not shown as Held 1H and its state is unchanged.
- **GM15.2.1-04 – Worn:** Change a held item to Worn; verify PF2e `changeCarryType(...)` persists the state without unintended loss of an existing slot state.
- **GM15.2.1-05 – Stowed:** Set an item to Stowed and verify the state persists correctly.
- **GM15.2.1-06 – Dropped:** Set an item to Dropped and verify the state persists correctly.
- **GM15.2.1-07 – Unsupported Core State:** Open an item whose Core carry state is not editable in the GM UI; verify the actual state is shown as unsupported, the select is disabled, and Actor data is unchanged.
- **GM15.2.1-08 – Invested On:** Toggle an investable item on; verify PF2e `toggleInvested(itemId)` persists the state without a console error.
- **GM15.2.1-09 – Invested Off:** Toggle the same item again and verify the state is cleanly removed.
- **GM15.2.1-10 – Non-investable Item:** Verify an item that cannot currently be invested has no Invested control.
- **GM15.2.1-11 – Quantity Positive:** Enter quantity `3` and verify the correct item updates.
- **GM15.2.1-12 – Quantity Negative:** Enter a negative quantity and record the result chosen by the PF2e/Core schema; verify the GM UI applies no local clamp.
- **GM15.2.1-13 – Quantity Decimal:** Enter quantity `1.5` and record the result chosen by the PF2e/Core schema; verify the GM UI applies no local quantity rule.
- **GM15.2.1-14 – Actor Isolation:** Change Actor A's carry state and verify Actor B remains completely unchanged.
- **GM15.2.1-15 – Targeted Refresh:** Change a carry state and verify only the affected Actor pane refreshes.
- **GM15.2.1-16 – Player Sheet Regression:** Open the normal V2 player sheet before and after the tests and verify it remains completely unchanged.

## M15.2.2 – GM Inventory pane width and overflow layout hotfix

- **GM15.2.2-01 – Inventory Width:** Open Inventory and verify every column, the Carry State select, and all action buttons are visible without clipping or overlap from the next pane.
- **GM15.2.2-02 – Mixed Views:** Show Actor A's Inventory beside Actor B's Overview; verify Actor A is wider, Actor B remains compact, and neither pane overlaps the other.
- **GM15.2.2-03 – Horizontal Overflow:** Open enough character panes to exceed the window width; verify `.gm-panes` scrolls horizontally while panes retain their minimum widths and their contents are not compressed.
- **GM15.2.2-04 – Collapse Inventory:** Collapse an Inventory pane and verify it returns to the compact width rather than retaining the Inventory width.
- **GM15.2.2-05 – Expand Again:** Expand the pane and verify Inventory returns to its full width with every column visible.
- **GM15.2.2-06 – Long Item Names:** Use items with long names and verify names ellipsize while Quantity, Bulk, Carry State, and Actions remain visible.
- **GM15.2.2-07 – Grid Layout:** Open Inventory in Grid layout and verify the pane is not compressed to 280px and no Inventory column is clipped.
- **GM15.2.2-08 – Player Sheet Regression:** Open the normal V2 player sheet and verify it remains completely unchanged.

## M15.3 – Isolated GM Spellcasting View

- **GM15.3-01 – Navigation:** Set Actor A to Spellcasting, Actor B to Overview, and Actor C to Inventory; verify every pane retains its own view state.
- **GM15.3-02 – No Spellcasting:** Open a martial character without spellcasting; verify the clean empty state and no exception.
- **GM15.3-03 – Prepared Caster:** Open a wizard or cleric; verify entries, non-empty ranks, prepared allocations, expended state, and slot counts match PF2e Core.
- **GM15.3-04 – Spontaneous Caster:** Open a sorcerer or bard; verify its repertoire and remaining slots, with no prepared-slot semantics.
- **GM15.3-05 – Innate Spells:** Open a character with innate spells; verify spells and per-spell uses display without exceptions.
- **GM15.3-06 – Focus Spells:** Verify focus spells appear and their Focus resource agrees with Overview.
- **GM15.3-07 – Cantrips:** Verify cantrips are clearly grouped and do not show false slot controls.
- **GM15.3-08 – Spell Summary:** Open a summary; verify the correct Core description appears and no other Actor pane changes.
- **GM15.3-09 – Open Spell:** Open a spell and verify the correct normal PF2e Spell sheet appears.
- **GM15.3-10 – Cast Prepared Spell:** Cast a prepared spell; verify the entry, rank and slot are correct, Core creates the chat output and consumes the resource, and only its Actor pane refreshes.
- **GM15.3-11 – Cast Spontaneous Spell:** Cast a spontaneous spell and verify PF2e Core handles its ranked slot.
- **GM15.3-12 – Cast Innate Spell:** Cast an innate spell and verify Core handles its per-spell use or frequency.
- **GM15.3-13 – Focus Cast:** Cast a focus spell and verify Core-owned casting updates the shared Focus resource.
- **GM15.3-14 – Actor Isolation:** Cast for Actor A and verify Actors B and C remain unchanged.
- **GM15.3-15 – External Spell Update:** Externally update a spell or spellcasting entry and verify only its Actor pane refreshes.
- **GM15.3-16 – Width:** Verify spell rows and buttons are not clipped or overlapped and horizontal console scrolling works with multiple panes.
- **GM15.3-17 – Collapse:** Collapse a Spellcasting pane; verify its body is absent and the pane returns to compact width.
- **GM15.3-18 – Player Sheet Regression:** Run the complete normal V2 Player Sheet suite and verify no change.
