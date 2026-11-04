# Delete Bug End-to-End Test Plan

## Application Overview

Plan end-to-end coverage for deleting a BuggyBoard bug from the Delete button in its Edit bug modal. Each scenario creates its own uniquely titled fixture bug through the board's New Bug form before opening the modal, so deletion never depends on existing database contents. Playwright CLI exploration confirmed that the modal shows a Delete button and that clicking it immediately closes the modal and removes the bug from the board without a confirmation dialog.

## Coverage Review

- Cover both acceptance criteria in `specs/features/12-delete-bug.md`: the Delete button is available in the Edit bug modal, and deleting removes the selected bug and closes the modal.
- Create fresh fixture bugs through the UI within every scenario before any delete action. Do not select or delete pre-existing board data.
- Verify deletion after a board reload so the test confirms the bug is no longer persisted, not merely hidden in the current view.
- In teardown, remove only fixture bugs created by that scenario, using their recorded IDs if they remain after a failed assertion.
- Include a two-fixture scenario to verify deleting one bug does not remove another.

## Test Scenarios

### 1. Delete bug

**Seed:** `tests/seed.spec.ts`

#### 1.1. deletes a newly created bug

**File:** `tests/delete-bug/deletes-newly-created-bug.spec.ts`

**Steps:**
  1. On the authenticated board, create a bug with a unique title, valid severity, owner, and description using the New Bug form. Record its ID for cleanup.
    - expect: The create dialog closes and the uniquely titled bug appears on the board.
  2. Open the row for that unique title.
    - expect: The Edit bug modal for the newly created bug is displayed.
    - expect: The modal contains a Delete button.
  3. Click Delete.
    - expect: A successful delete response is received for the created bug.
    - expect: The Edit bug modal closes.
    - expect: The board no longer contains the uniquely titled bug.
  4. Reload the board.
    - expect: The deleted bug is still absent.
  5. In teardown, delete the created bug by its recorded ID if it remains.
    - expect: No pre-existing bug is changed or deleted.

#### 1.2. deletes only the selected bug

**File:** `tests/delete-bug/deletes-only-selected-bug.spec.ts`

**Steps:**
  1. On the authenticated board, create two bugs with different unique titles using the New Bug form. Record both IDs for cleanup.
    - expect: Both newly created bugs appear on the board.
  2. Open the row for the first bug and click Delete in its Edit bug modal.
    - expect: The modal closes after a successful delete response for the first bug.
    - expect: The first bug is absent from the board.
    - expect: The second newly created bug remains on the board.
  3. Reload the board.
    - expect: The first bug remains absent and the second bug remains present.
  4. In teardown, delete either created bug by its recorded ID if it remains.
    - expect: No pre-existing bug is changed or deleted.
