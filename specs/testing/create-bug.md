# Bug Creation End-to-End Test Plan

## Application Overview

Plan end-to-end coverage for creating a BuggyBoard bug. Tests use `tests/seed.spec.ts` to authenticate. Browser exploration confirmed the Create bug dialog's controls, initial values, required-field feedback, dismissal controls, and successful board update.

## Coverage Review

- The original validation case submitted all fields blank, so it did not independently prove that each required text field is validated or that a failed validation sends no create request.
- The successful-create case checked the board row but not whether the description was saved. Verify the successful POST response as well as the row.
- The create-bug feature spec says displaying bugs on the board is out of scope. Keep the board-row check as integration coverage with the board feature, not as the only proof that creation succeeded.
- The feature spec calls severity required and lists a blank-severity scenario, but the UI offers only HIGH, MID, and LOW and always has a valid selection (currently MID). Do not attempt to clear the select and encode an unreachable state as a UI requirement. Verify the offered values and successful saves for each severity instead.
- MID is the observed initial severity, but the feature spec does not require that default. Avoid making the specific default contractual unless the product spec is updated to require it.

## Test Scenarios

### 1. Create bug

**Seed:** `tests/seed.spec.ts`

#### 1.1. opens the create form with the current user's owner value

**File:** `tests/create-bug/opens-create-form-with-defaults.spec.ts`

**Steps:**
  1. Click the New Bug button on the board.
    - expect: The Create bug dialog is visible and exposes Title, Severity, Owner, and Description controls, plus Save and Cancel buttons.
    - expect: The Owner field is pre-filled with the signed-in username.
    - expect: Title and Description are empty.
    - expect: Severity offers HIGH, MID, and LOW, and its selected value is one of those valid options.
    - expect: The Title field receives focus.

#### 1.2. creates a bug with the selected details

**File:** `tests/create-bug/creates-bug-with-valid-details.spec.ts`

**Steps:**
  1. Click New Bug, enter a unique title, select HIGH severity, enter an owner and description, then click Save.
    - expect: The create request succeeds with HTTP 201 and returns a bug with a numeric ID and the submitted title, HIGH severity, owner, and description.
    - expect: The newly created bug has OPEN state.
    - expect: The dialog closes after the bug is saved.
    - expect: The Bugs table contains the new bug's ID, title, HIGH severity, and owner.
    - expect: The new bug appears under the Open filter.

#### 1.3. saves each supported severity

**File:** `tests/create-bug/creates-bug-with-each-severity.spec.ts`

**Steps:**
  1. Create a bug with each of HIGH, MID, and LOW selected in turn, using a unique title for each.
    - expect: Each supported severity can be selected and saved.
    - expect: The create response and resulting board row show the corresponding uppercase severity.
    - expect: The selected severity control uses the corresponding severity color specified by the design tokens.

#### 1.4. rejects each blank required text field independently

**File:** `tests/create-bug/requires-each-text-field.spec.ts`

**Steps:**
  1. In separate attempts, leave only Title, Owner, or Description blank while filling the other text fields and selecting a valid severity; click Save each time.
    - expect: The dialog remains open and identifies the specific blank field as required.
    - expect: No POST request to `/api/bugs` is sent for any invalid attempt and no bug is added.

#### 1.5. rejects whitespace-only required text values

**File:** `tests/create-bug/rejects-whitespace-only-text.spec.ts`

**Steps:**
  1. In separate attempts, enter only whitespace in Title, Owner, or Description while providing valid values for the other fields; click Save.
    - expect: Each whitespace-only value is treated as blank.
    - expect: The dialog remains open with the corresponding required-field message.
    - expect: No create request is sent and no bug is added.

#### 1.6. trims text values and preserves special characters

**File:** `tests/create-bug/trims-and-preserves-text.spec.ts`

**Steps:**
  1. Enter a unique title, owner, and description with leading and trailing whitespace; include characters such as `<`, `>`, and `&` in the title or description, select a valid severity, and save.
    - expect: The successful create response contains the text values trimmed at the boundaries while preserving their meaningful characters.
    - expect: The board displays the title as text and does not interpret its special characters as markup.
    - expect: The dialog closes and the bug is saved once.

#### 1.7. keeps the dialog open and preserves input after a failed save

**File:** `tests/create-bug/retries-after-save-failure.spec.ts`

**Steps:**
  1. Fill all required fields and intercept the create request to return a server error with a message.
    - expect: The dialog remains open and displays the returned error message.
    - expect: Entered field values are preserved and the Save button is usable again.
    - expect: No bug is added to the board.
  2. Allow the next create request to succeed and click Save again.
    - expect: The dialog closes and exactly one bug with the entered values is added.

#### 1.8. cancels creation and discards unsaved values

**File:** `tests/create-bug/cancels-creation.spec.ts`

**Steps:**
  1. Open the Create bug dialog, enter a unique title and description, then click Cancel.
    - expect: The dialog closes without sending a create request.
  2. Reopen the Create bug dialog.
    - expect: Title and Description are empty and Owner is reset to the signed-in username.
    - expect: Severity has a valid option selected; do not require a particular default unless the product spec defines one.

#### 1.9. closes creation with the close control

**File:** `tests/create-bug/closes-creation-dialog.spec.ts`

**Steps:**
  1. Open the Create bug dialog and enter a unique title.
  2. Click the dialog's Close button (the X control).
    - expect: The dialog closes without sending a create request.
    - expect: The unsaved title does not appear in the Bugs table.

#### 1.10. closes creation with Escape

**File:** `tests/create-bug/escapes-creation-dialog.spec.ts`

**Steps:**
  1. Open the Create bug dialog and enter a unique title.
  2. Press Escape.
    - expect: The dialog closes without sending a create request.
    - expect: The unsaved title does not appear in the Bugs table.

#### 1.11. clicking the backdrop does not discard form data

**File:** `tests/create-bug/backdrop-preserves-form.spec.ts`

**Steps:**
  1. Open the Create bug dialog, enter a unique title and description, and click the dimmed backdrop outside the dialog.
    - expect: The dialog remains open.
    - expect: The entered values are preserved.
    - expect: No create request is sent.
