# Edit Bug End-to-End Test Plan

## Application Overview

Plan end-to-end coverage for viewing and editing a BuggyBoard bug from the board. Clicking a bug row opens an Edit bug modal that displays its current values and allows edits to its title, severity, state, owner, and description. Playwright CLI exploration confirmed the modal title includes the bug ID, the ID field is read-only, Save is disabled until a valid change is made, and the modal includes Save, Cancel, Close, and Delete controls.

## Test Isolation and Data Management

- Every scenario is an independent test and performs its own setup: log in through the UI, create a uniquely titled bug through the New Bug form, and record its ID and original values before opening the Edit bug modal.
- Do not depend on another scenario, shared browser state, pre-existing bugs, or a separately run seed test.
- Each test's teardown removes only the fixture bug it created, by its recorded ID, if it still exists. Do not remove or modify existing board data.
- Use the UI for all edit actions and assertions. Teardown may use the API to remove a fixture left behind by a failed test.
- Tests that change the fixture should verify persisted values after reloading the board and reopening the bug.

## Coverage Review

- Cover the edit-bug acceptance criteria in `specs/features/09-edit-bug.md`: opening a row, displayed values, editable versus read-only fields, severity choices and color coding, save, cancel, close, Escape, backdrop behavior, and Save enablement.
- Also cover changing a bug's Open/Closed state, which is editable in the modal and specified in `specs/features/13-bug-status.md`.
- The Severity dropdown offers only HIGH, MID, and LOW and has no blank option. Verify those options and their color coding; do not specify an impossible UI action that clears Severity.
- Test blank Title, Owner, and Description independently. Each is a text field that can be cleared through the UI.
- Keep each scenario focused on one behavior; every scenario recreates its own bug and does not rely on another test.

## Test Scenarios

### 1. Edit bug

#### 1.1. opens an existing bug with its current values

**File:** `tests/edit-bug/opens-bug-with-current-values.spec.ts`

**Setup:** Log in and create a fresh bug with a unique title, known severity, Open state, owner, and description. Record the returned ID and values.

**Steps:**
  1. Click the row for the newly created bug.
    - expect: The Edit bug modal is visible and its heading is `Edit bug #<id>` for the fixture's ID.
    - expect: The modal displays the fixture's ID, title, severity, state, owner, and description.
    - expect: Save and Cancel buttons are visible.

**Cleanup:** Remove this scenario's fixture bug if it remains.

#### 1.2. keeps the ID read-only and allows editing the other fields

**File:** `tests/edit-bug/field-editability.spec.ts`

**Setup:** Log in and create a fresh bug; record its ID.

**Steps:**
  1. Open the fixture bug's row.
    - expect: The ID field contains the fixture's ID and cannot be edited.
    - expect: Title, Owner, and Description accept text input.
    - expect: Severity and State are selectable dropdowns.
  2. Change each editable field, then cancel.
    - expect: The modal accepts the edits without changing the ID.
    - expect: Cancel closes the modal without saving the changes.

**Cleanup:** Remove this scenario's fixture bug if it remains.

#### 1.3. offers all severities with matching color coding

**File:** `tests/edit-bug/severity-options-and-colors.spec.ts`

**Setup:** Log in and create three fresh bugs through the New Bug form, one with each severity (HIGH, MID, LOW). Record their IDs and unique titles.

**Steps:**
  1. Open the HIGH fixture's row.
    - expect: Severity is a dropdown with HIGH, MID, and LOW options, and HIGH is selected.
  2. Compare the selected HIGH severity's text color with the HIGH board badge, then cancel.
    - expect: The selected severity's color matches the board color (strong terracotta).
  3. Repeat for the MID and LOW fixtures.
    - expect: Each fixture opens with its own severity selected.
    - expect: MID and LOW text colors match their board badges (amber and muted sage, respectively).

**Cleanup:** Remove only these three scenario-created fixture bugs if any remain.

#### 1.4. saves edited fields and preserves them after reload

**File:** `tests/edit-bug/saves-edited-fields.spec.ts`

**Setup:** Log in and create a fresh Open bug; record its ID and original values.

**Steps:**
  1. Open the fixture bug and change its title, severity, owner, and description to distinct values.
  2. Click Save.
    - expect: A successful update response is received for the fixture ID.
    - expect: The modal closes and the board shows the changed title, severity, and owner.
  3. Reload the board and open the changed bug.
    - expect: The modal fields contain the changed title, severity, owner, and description.
    - expect: The fixture ID is unchanged.

**Cleanup:** Remove this scenario's fixture bug by its recorded ID if it remains.

#### 1.5. saves a state change

**File:** `tests/edit-bug/saves-state-change.spec.ts`

**Setup:** Log in and create a fresh Open bug; record its ID and unique title.

**Steps:**
  1. Open the fixture bug and select Closed in the State dropdown.
  2. Click Save.
    - expect: The update succeeds and the modal closes.
  3. Select the Closed board filter.
    - expect: The fixture bug appears under Closed.
  4. Reload the board and select the Closed filter again.
    - expect: The fixture still appears as Closed after reload.
    - expect: The fixture does not appear when the Open filter is selected.

**Cleanup:** Remove this scenario's fixture bug by its recorded ID if it remains.

#### 1.6. cancels edits without saving

**File:** `tests/edit-bug/cancels-edits.spec.ts`

**Setup:** Log in and create a fresh bug; record its ID and original values.

**Steps:**
  1. Open the fixture and change at least its title and description.
  2. Click Cancel.
    - expect: The modal closes without an update request.
  3. Reopen the fixture after reloading the board.
    - expect: The original title, severity, state, owner, and description are unchanged.

**Cleanup:** Remove this scenario's fixture bug if it remains.

#### 1.7. closes with the X without saving edits

**File:** `tests/edit-bug/closes-with-x-without-saving.spec.ts`

**Setup:** Log in and create a fresh bug; record its ID and original values.

**Steps:**
  1. Open the fixture and change a field.
  2. Click the modal's Close (X) button.
    - expect: The modal closes without an update request.
  3. Reopen the fixture.
    - expect: The original field values are unchanged.

**Cleanup:** Remove this scenario's fixture bug if it remains.

#### 1.8. closes with Escape without saving edits

**File:** `tests/edit-bug/closes-with-escape-without-saving.spec.ts`

**Setup:** Log in and create a fresh bug; record its ID and original values.

**Steps:**
  1. Open the fixture and change a field.
  2. Press Escape.
    - expect: The modal closes without an update request.
  3. Reopen the fixture.
    - expect: The original field values are unchanged.

**Cleanup:** Remove this scenario's fixture bug if it remains.

#### 1.9. preserves edits when clicking the backdrop

**File:** `tests/edit-bug/backdrop-preserves-edits.spec.ts`

**Setup:** Log in and create a fresh bug; record its ID.

**Steps:**
  1. Open the fixture and change its title and description.
  2. Click the dimmed backdrop outside the modal panel.
    - expect: The modal remains open.
    - expect: The changed title and description remain in their fields.
    - expect: No update request is sent.

**Cleanup:** Remove this scenario's fixture bug if it remains.

#### 1.10. disables Save when there are no changes

**File:** `tests/edit-bug/save-disabled-without-changes.spec.ts`

**Setup:** Log in and create a fresh bug.

**Steps:**
  1. Open the fixture without changing any field.
    - expect: Save is disabled.

**Cleanup:** Remove this scenario's fixture bug if it remains.

#### 1.11. disables Save when the title is blank

**File:** `tests/edit-bug/save-disabled-with-blank-title.spec.ts`

**Setup:** Log in and create a fresh bug.

**Steps:**
  1. Open the fixture and clear Title.
    - expect: Save is disabled.
    - expect: The bug has not been updated.

**Cleanup:** Remove this scenario's fixture bug if it remains.

#### 1.12. disables Save when the owner is blank

**File:** `tests/edit-bug/save-disabled-with-blank-owner.spec.ts`

**Setup:** Log in and create a fresh bug.

**Steps:**
  1. Open the fixture and clear Owner.
    - expect: Save is disabled.
    - expect: The bug has not been updated.

**Cleanup:** Remove this scenario's fixture bug if it remains.

#### 1.13. disables Save when the description is blank

**File:** `tests/edit-bug/save-disabled-with-blank-description.spec.ts`

**Setup:** Log in and create a fresh bug.

**Steps:**
  1. Open the fixture and clear Description.
    - expect: Save is disabled.
    - expect: The bug has not been updated.

**Cleanup:** Remove this scenario's fixture bug if it remains.
