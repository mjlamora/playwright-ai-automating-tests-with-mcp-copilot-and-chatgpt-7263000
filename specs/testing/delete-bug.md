# Delete Bug End-to-End Test Plan

## Application Overview

Plan end-to-end coverage for deleting a BuggyBoard bug from the Delete button in its Edit bug modal. Each scenario creates its own uniquely titled fixture bug through the board's New Bug form before opening the modal, so deletion never depends on existing database contents. The Delete button opens a confirmation modal; deletion occurs only after explicit confirmation.

## Coverage Review

- Cover the Edit modal's Delete button, the confirmation step, cancellation without mutation, and deletion after explicit confirmation.
- Create fresh fixture bugs through the UI within every scenario before any delete action. Do not select or delete pre-existing board data.
- Verify deletion after a board reload so the test confirms the bug is no longer persisted, not merely hidden in the current view.
- In teardown, remove only fixture bugs created by that scenario, using their recorded IDs if they remain after a failed assertion.
- Include a two-fixture scenario to verify deleting one bug does not remove another.

## Test Scenarios

### 1. Delete bug

**Seed:** `tests/seed.spec.ts`

#### 1.1. cancels deletion without changing the bug

**File:** `tests/delete-bug/cancels-delete-confirmation.spec.ts`

**Steps:**
  1. On the authenticated board, create a bug with a unique title, valid severity, owner, and description using the New Bug form. Record its ID for cleanup.
    - expect: The create dialog closes and the uniquely titled bug appears on the board.
  2. Open the row for that unique title.
    - expect: The Edit bug modal for the newly created bug is displayed.
    - expect: The modal contains a Delete button.
  3. Click Delete in the Edit bug modal, then cancel in the confirmation.
    - expect: The confirmation closes and the Edit bug modal remains open with its original field values.
    - expect: No DELETE request is sent.
  4. Reopen the confirmation and dismiss it with X and Escape; also click outside it.
    - expect: X and Escape return to the Edit bug modal without deleting.
    - expect: Clicking outside leaves the confirmation open and does not delete.
  5. Close the Edit bug modal and reload the board.
    - expect: The uniquely titled bug remains visible and unchanged.
  6. In teardown, delete the created bug by its recorded ID.
    - expect: No pre-existing bug is changed or deleted.

#### 1.2. deletes only the selected bug

**File:** `tests/delete-bug/deletes-only-selected-bug.spec.ts`

**Steps:**
  1. On the authenticated board, create two bugs with different unique titles using the New Bug form. Record both IDs for cleanup.
    - expect: Both newly created bugs appear on the board.
  2. Open the row for the first bug and click Delete in its Edit bug modal.
    - expect: A confirmation modal identifies the first bug.
    - expect: No delete request is sent before confirmation, and both fixtures remain visible.
  3. Confirm deletion.
    - expect: The modal closes after a successful delete response for the first bug.
    - expect: The first bug is absent from the board.
    - expect: The second newly created bug remains on the board.
  4. Reload the board.
    - expect: The first bug remains absent and the second bug remains present.
  5. In teardown, delete either created bug by its recorded ID if it remains.
    - expect: No pre-existing bug is changed or deleted.
