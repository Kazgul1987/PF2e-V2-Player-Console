# Manual Foundry V14 / PF2e 8.4 tests

These tests require a running Foundry world and cannot be replaced by Node syntax validation. Repeat interaction tests in the normal window and after **Detach to Browser Window**.

## M2-01 – Perception

1. Open a PF2e character in the V2 sheet and click Perception.
2. Confirm the PF2e check dialog follows the user's check-dialog setting, complete the roll, and inspect the normal PF2e chat card.
3. Detach and repeat.

## M2-02 – Saves

Repeat M2-01 for Fortitude, Reflex, and Will. Compare modifier, options, dialog, and chat result with the core sheet.

## M2-03 – Skills and Lore

Roll Athletics and at least one other standard skill. If the Actor has Lore/custom entries exposed by `actor.skills`, confirm they appear and roll using their runtime slug. Repeat detached.

## M2-04 – Modifier keys

With the core and V2 sheets, compare normal click, Shift-click (invert the configured dialog behavior), and Ctrl/Command-click (GM roll for a GM, blind roll otherwise). Confirm the V2 window and detached window agree with core.

## M2-05 – Editable name and live sync

1. As owner, change the name in the V2 header and submit.
2. Verify the Actor document, directory, core sheet, and V2 title/header update.
3. Change the name in the core sheet and verify the V2 sheet updates.
4. Repeat detached. Also create, update, and delete an embedded Item and verify this Actor refreshes while an unrelated Actor's sheet does not.

## M2-06 – Observer

1. Open the Actor as Observer and Limited users where core allows viewing.
2. Confirm the name is read-only and no update can be submitted.
3. Compare roll permission and resulting messages with the core sheet.

## M2-07 – Lifecycle

Close and reopen the console, then change the Actor and an embedded Item. Confirm one refresh occurs and that the closed application does not render (no leaked hooks).
