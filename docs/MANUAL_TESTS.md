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
