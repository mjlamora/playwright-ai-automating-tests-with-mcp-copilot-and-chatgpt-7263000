# Bug Board Display End-to-End Test Plan

## Coverage Assessment

The current tests create and inspect selected rows as setup for sorting, search, severity, edit, and delete scenarios, but no test verifies the board's complete table contract. There is no direct check for its column order, every stored bug appearing once, uppercase severity labels, or the empty-table state required by `specs/features/07-bug-board.md`.

Playwright CLI exploration confirmed the board exposes a table named Bugs with ID, Severity, Title, and Owner columns. The local database contains pre-existing data, so tests for an empty board must not delete shared records.

## Test Setup

- Authenticate using a valid `users.json` account.
- Create uniquely titled bugs through the API and delete only those test-owned IDs in teardown.
- For the no-bugs scenario, mock the bugs-list response to return an empty list rather than deleting existing database content.
- Use `boardPage` and other page-object fixtures from `tests/fixtures/page-objects.ts`.
- Keep each scenario independent and use Arrange–Act–Assert comments.

## Test Scenarios

### Board display

#### 1. Displays the required columns in order

**File:** `tests/bug-board/displays-board-columns-in-order.spec.ts`

**Arrange:** Authenticate and load the board.

**Act:** Inspect the Bugs table header row.

**Assert:** The table has the columns ID, Severity, Title, and Owner, in that left-to-right order.

#### 2. Displays all bugs and their row values

**File:** `tests/bug-board/displays-all-bugs.spec.ts`

**Arrange:** Create several distinct bugs through the API, including different severity values, and reload the board.

**Act:** Inspect the table rows.

**Assert:**

- Each created bug appears exactly once.
- Each row shows the bug's ID, severity, title, and owner matching its API data.
- Severity labels are displayed in uppercase.

#### 3. Displays an empty table when there are no bugs

**File:** `tests/bug-board/displays-empty-board.spec.ts`

**Arrange:** Authenticate and route the bugs-list request to a successful empty-list response.

**Act:** Load the board.

**Assert:** The Bugs table and its column headers remain visible, with no data rows.
