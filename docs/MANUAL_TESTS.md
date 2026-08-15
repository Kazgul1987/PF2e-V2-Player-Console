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
