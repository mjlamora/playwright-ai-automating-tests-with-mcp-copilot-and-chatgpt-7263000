# Board Search End-to-End Test Plan

## Coverage Assessment

`tests/search-bug/search-atomic.spec.ts` verifies broad title matching, matching versus non-matching rows, and a no-results message. Its fixture also provides incidental case-insensitive coverage because the lowercase query `login` matches titles beginning with `Login`. `search-grand-tour.spec.ts` uses the clear control but immediately enters another query, so it does not assert that clearing restores all rows. No current test verifies punctuation or whitespace normalization or that sorting survives a search.

Playwright CLI exploration confirmed the search field is in the board title bar and that a clear control appears after entering a query.

## Test Setup

- Authenticate with a valid test account and create uniquely titled fixture bugs through the API.
- Include deterministic titles that exercise case, punctuation, and repeated whitespace; delete only fixture IDs in teardown.
- Use `boardPage` and the page-object fixtures from `tests/fixtures/page-objects.ts`.
- Keep tests independent and use Arrange–Act–Assert comments.

## Test Scenarios

### Search the board

#### 1. Shows all bugs when search is blank

**File:** `tests/search-bug/shows-all-bugs-for-blank-search.spec.ts`

**Arrange:** Create several fixture bugs and load the board with an empty search field.

**Act:** Inspect the search field and table.

**Assert:** All fixture bugs are visible and no no-results message is shown.

#### 2. Normalizes punctuation and whitespace

**File:** `tests/search-bug/normalizes-search-query.spec.ts`

**Arrange:** Create fixture titles including `Login fails`, `Issue with log-in`, and a title with repeated whitespace between words.

**Act:** Search with case variants, punctuation variants, and queries containing repeated whitespace in separate focused cases.

**Assert:** Matching titles follow the case-insensitive, collapsed-whitespace, normalized-punctuation rules in `specs/features/11-search-board.md`; unrelated fixture titles remain hidden.

#### 3. Clears the search and restores the board

**File:** `tests/search-bug/clears-search-and-restores-board.spec.ts`

**Arrange:** Create multiple fixture bugs and enter a query that matches only a subset.

**Act:** Click the clear-search control.

**Assert:** The search field is empty, the clear control is no longer shown, all fixture bugs are visible, and the no-results message is absent.

#### 4. Preserves sorting while searching

**File:** `tests/search-bug/preserves-sort-while-searching.spec.ts`

**Arrange:** Create titles with a deterministic sort order and activate Title ascending.

**Act:** Enter a query matching a subset of those titles.

**Assert:** Only matching bugs remain, their relative order stays ascending, and the Title header retains its ascending indicator.
