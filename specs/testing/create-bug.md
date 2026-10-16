# Bug Creation End-to-End Test Plan

## Application Overview

Plan end-to-end coverage for creating a BuggyBoard bug. The app is loaded with the existing `tests/seed.spec.ts` login setup; browser exploration through Playwright MCP confirmed the Create bug dialog fields, validation messages, default values, dismissal controls, and successful board update.

## Test Scenarios

### 1. Create bug

**Seed:** `tests/seed.spec.ts`

#### 1.1. creates a bug with the selected details

**File:** `tests/create-bug/creates-bug-with-valid-details.spec.ts`

**Steps:**
  1. Click the New Bug button on the board.
    - expect: The Create bug dialog is visible.
    - expect: The form has Title, Severity, Owner, and Description controls.
  2. Enter a unique title, select HIGH severity, enter an owner and description, and click Save.
    - expect: The dialog closes after the bug is saved.
    - expect: The Bugs table contains a row with the new title, HIGH severity, and entered owner.
    - expect: The new bug appears under the default Open filter.

#### 1.2. requires a title and description

**File:** `tests/create-bug/requires-title-and-description.spec.ts`

**Steps:**
  1. Open the Create bug dialog and click Save without entering any values.
    - expect: The dialog remains visible.
    - expect: An alert contains “Title is required.” and “Description is required.”
    - expect: No bug with an empty title is added to the Bugs table.

#### 1.3. cancels creation and discards unsaved values

**File:** `tests/create-bug/cancels-creation.spec.ts`

**Steps:**
  1. Open the Create bug dialog, enter a unique title and description, then click Cancel.
    - expect: The dialog closes.
    - expect: The unsaved title does not appear in the Bugs table.
  2. Reopen the Create bug dialog.
    - expect: The form is reset: Title and Description are empty, Severity is MID, and Owner is the signed-in username.

#### 1.4. closes creation with the close control

**File:** `tests/create-bug/closes-creation-dialog.spec.ts`

**Steps:**
  1. Open the Create bug dialog and enter a unique title.
    - expect: The dialog is visible with the entered title.
  2. Click the dialog's Close button (the X control).
    - expect: The dialog closes without saving.
    - expect: The unsaved title does not appear in the Bugs table.

#### 1.5. closes creation with Escape

**File:** `tests/create-bug/escapes-creation-dialog.spec.ts`

**Steps:**
  1. Open the Create bug dialog and enter a unique title.
    - expect: The dialog is visible with the entered title.
  2. Press Escape.
    - expect: The dialog closes without saving.
    - expect: The unsaved title does not appear in the Bugs table.
