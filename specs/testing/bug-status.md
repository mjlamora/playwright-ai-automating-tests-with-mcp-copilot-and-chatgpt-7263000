# Bug Status End-to-End Test Plan

## Coverage Assessment

`tests/edit-bug/saves-state-change.spec.ts` verifies that an existing bug can be changed to Closed, persists after reload, appears under Closed, and is absent under Open. `tests/edit-bug/opens-bug-with-current-values.spec.ts` checks that the edit dialog has a state value. No test creates a bug and verifies its initial Open state, checks the default Open filter against a mixed dataset, verifies Closed-only results or an empty Closed state, or checks search/sort composition with the state filter.

Playwright CLI exploration confirmed the board provides Open and Closed controls, Open is selected by default, and selecting Closed with no closed bugs displays “No bugs matched.”

## Test Setup

- Authenticate with a valid account from `users.json`.
- Create uniquely titled open and closed fixtures through the API; record IDs and delete only those fixtures in teardown.
- Use the existing `boardPage`, `createBugDialog`, and `editBugDialog` fixtures.
- Keep scenarios independent and follow Arrange–Act–Assert.

## Test Scenarios

### Bug status

#### 1. Creates new bugs as Open

**File:** `tests/bug-status/creates-bugs-as-open.spec.ts`

**Arrange:** Authenticate and open the New Bug dialog.

**Act:** Create a valid bug through the UI.

**Assert:** The create response and persisted bug have state Open, and the bug appears with Open selected.

#### 2. Defaults the board filter to Open

**File:** `tests/bug-status/defaults-to-open-bugs.spec.ts`

**Arrange:** Create at least one Open and one Closed fixture bug.

**Act:** Navigate to or reload the board without changing the state filter.

**Assert:** Open is selected, Open fixtures are visible, and Closed fixtures are absent.

#### 3. Shows only Closed bugs when Closed is selected

**File:** `tests/bug-status/filters-closed-bugs.spec.ts`

**Arrange:** Create both Open and Closed fixture bugs.

**Act:** Select Closed.

**Assert:** Closed fixtures are visible and Open fixtures are absent.

#### 4. Shows the empty-state message when a selected state has no bugs

**File:** `tests/bug-status/shows-empty-state-for-selected-status.spec.ts`

**Arrange:** Ensure the fixture dataset has Open bugs and no Closed bugs.

**Act:** Select Closed.

**Assert:** “No bugs matched.” is displayed and there are no bug rows.

#### 5. Applies sorting to the selected state

**File:** `tests/bug-status/sorts-with-state-filter.spec.ts`

**Arrange:** Create Open and Closed fixtures with titles that sort differently; select Open.

**Act:** Sort by Title.

**Assert:** Only Open fixtures are shown and they follow the selected Title sort order.

#### 6. Applies search and state filtering together

**File:** `tests/bug-status/searches-with-state-filter.spec.ts`

**Arrange:** Create Open and Closed fixtures with both matching and non-matching title fragments.

**Act:** Select a state and enter a query matching bugs across both states.

**Assert:** Only bugs matching both the selected state and the title query are displayed.
