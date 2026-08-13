# Manual Foundry V14 / PF2e 8.4 tests

These tests require a running Foundry V14/PF2e world and cannot be replaced by Node validation. Compare with the official sheet, and repeat interaction cases after **Detach to Browser Window** where specified.

## M2-FORM-01 – Name via Save/Submit

1. Open the V2 sheet as owner; change the name and use Save.
2. Verify the Actor Document, directory, official PF2e sheet, V2 header, and V2 window title.
3. Confirm the sheet remains open and only `name` changed.

## M2-FORM-02 – Name via Enter

1. Put the cursor in the name field, change it, and press Enter.
2. Confirm there is no browser navigation or page reload.
3. Confirm the Actor name updates and all views synchronize.
4. Submit whitespace-only text and confirm validation prevents the update.

## M2-FORM-03 – Detached edit

1. Detach the sheet, change the name, and submit with both Save and Enter.
2. Verify the Actor update and synchronization in the main Foundry window.
3. Confirm keyboard navigation reaches the input and submit button without returning to the main DOM.

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
3. Attempt a synthetic/DOM-triggered submit as a non-owner and confirm the Document does not update and a localized error appears.
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

All cases above are mandatory in a running world. Particular regression focus: open → detach → switch tab → edit/Enter → skill/save/perception/secret roll → operate dialog → external Actor/Item update. Static checks cannot prove browser-window focus, Foundry permission thresholds, localization loading, PF2e chat visibility, or sheet registration compatibility.

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
