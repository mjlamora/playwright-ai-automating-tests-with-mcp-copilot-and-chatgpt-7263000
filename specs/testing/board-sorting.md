# Board Sorting End-to-End Test Plan

## Application Overview

Plan end-to-end coverage for BuggyBoard board sorting. The sort-board feature spec defines four sortable columns (ID, Severity, Title, Owner), default Severity descending, ascending-first behavior for an unsorted column, per-column direction toggling, and exactly one active sort indicator. Playwright CLI exploration on `/board` confirmed the Severity-down default, clicking Title produces ascending order with an up arrow, clicking Title again reverses the order and shows a down arrow, and switching columns changes the active sort. Existing live data was not diverse enough to prove every comparator, so tests create deterministic fixture bugs through the API and clean them up.

## Coverage Assessment

The current suite covers the specified sorting behaviors in `tests/sort-board/board-sorting.spec.ts`: default order, sorting and direction toggles for all four columns, and switching the active sort. The scenario paths below describe the test cases consolidated into that spec file; sorting is not an identified coverage gap.

## Test Scenarios

### 1. Board sorting

**Seed:** `tests/seed.spec.ts`

#### 1.1. shows bugs in default severity-descending order

**File:** `tests/sort-board/board-sorting.spec.ts`

**Steps:**
  1. Use the authenticated board session and create three OPEN bugs through POST /api/bugs with distinct titles and severities HIGH, MID, and LOW; record returned IDs for cleanup.
    - expect: Each fixture is created successfully and is visible in the Open board.
  2. Reload the board without clicking a sortable header.
    - expect: The fixture bugs appear in HIGH, then MID, then LOW severity groups.
    - expect: The Severity header has a descending (down) indicator.
    - expect: ID, Title, and Owner headers have no sort indicator.
  3. Delete the created fixture bugs in teardown using their recorded IDs.
    - expect: All fixture bugs are removed even if an assertion fails.

#### 1.2. sorts titles in ascending and descending order

**File:** `tests/sort-board/board-sorting.spec.ts`

**Steps:**
  1. Create three OPEN fixture bugs with distinct titles in deliberately non-alphabetical order and retain their IDs for cleanup.
    - expect: All three fixture titles are present on the board.
  2. Click the Title header once.
    - expect: Fixture titles are ordered alphabetically ascending.
    - expect: The Title header shows an up indicator; the other headers show none.
  3. Click the Title header again.
    - expect: Fixture titles are ordered alphabetically descending.
    - expect: The Title header shows a down indicator; the other headers show none.
  4. Delete the created fixture bugs in teardown.
    - expect: All fixture bugs are removed.

#### 1.3. sorts IDs in ascending and descending order

**File:** `tests/sort-board/board-sorting.spec.ts`

**Steps:**
  1. Create three OPEN fixture bugs and retain the numeric IDs returned by the API.
    - expect: Each fixture has a unique numeric ID.
  2. Click the ID header once, then again.
    - expect: After the first click, fixture IDs appear in ascending numeric order and ID shows an up indicator.
    - expect: After the second click, fixture IDs appear in descending numeric order and ID shows a down indicator.
    - expect: Only ID shows a sort indicator.
  3. Delete the created fixture bugs in teardown.
    - expect: All fixture bugs are removed.

#### 1.4. sorts owners in ascending and descending order

**File:** `tests/sort-board/board-sorting.spec.ts`

**Steps:**
  1. Create three OPEN fixture bugs with distinct owner values (for example, Alice, Margo, and Zed) and retain their IDs.
    - expect: The three fixture owners are represented on the board.
  2. Click the Owner header once, then again.
    - expect: After the first click, fixture rows are ordered by owner ascending and Owner shows an up indicator.
    - expect: After the second click, fixture rows are ordered by owner descending and Owner shows a down indicator.
    - expect: Only Owner shows a sort indicator.
  3. Delete the created fixture bugs in teardown.
    - expect: All fixture bugs are removed.

#### 1.5. sorts severity in ascending and descending order

**File:** `tests/sort-board/board-sorting.spec.ts`

**Steps:**
  1. Create three OPEN fixture bugs with severities HIGH, MID, and LOW and retain their IDs.
    - expect: The three severity values are represented on the board.
  2. Click the initially descending Severity header once, then click it again.
    - expect: After the first click, severities appear LOW, then MID, then HIGH and Severity shows an up indicator.
    - expect: After the second click, severities appear HIGH, then MID, then LOW and Severity shows a down indicator.
    - expect: No other column shows a sort indicator.
  3. Delete the created fixture bugs in teardown.
    - expect: All fixture bugs are removed.

#### 1.6. switches the active sort to a different column

**File:** `tests/sort-board/board-sorting.spec.ts`

**Steps:**
  1. Create three OPEN fixture bugs with conflicting owner/severity ordering: HIGH owned by Zed, MID owned by Alice, and LOW owned by Margo. Retain their IDs for cleanup.
    - expect: Fixture values distinguish the relevant sort orders.
  2. Click Owner, then click Severity.
    - expect: After selecting Severity, its header is the only one with a sort indicator.
    - expect: Owner no longer shows an indicator.
    - expect: Severity is sorted ascending on its first selection, so fixture rows appear LOW/Margo, MID/Alice, then HIGH/Zed.
  3. Delete the created fixture bugs in teardown.
    - expect: All fixture bugs are removed.
