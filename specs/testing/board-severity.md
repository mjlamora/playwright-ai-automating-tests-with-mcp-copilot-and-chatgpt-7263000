# Board Severity Color-Coding Test Plan

## Application Overview

The board displays bug severities as color-coded badges. Feature spec [`08-board-severity.md`](../features/08-board-severity.md) defines the HIGH terracotta (`#b84a2e`), MID amber (`#a67c47`), and LOW sage (`#4a6b5e`) design tokens, tinted badge backgrounds, and stronger label weight.

Playwright CLI exploration of `/board` confirmed that severity values are visible as badge text, that badge elements expose `data-severity`, and that the browser resolves the severity CSS tokens and badge rules. Tests create unique HIGH, MID, and LOW bug fixtures through the API, authenticate through the login page object fixture, and remove fixtures in teardown.

## Test Setup and Cleanup

- Each test independently signs in and creates one fixture bug per severity using `POST /api/bugs`.
- Record each created bug ID as soon as its API response succeeds.
- Delete all recorded fixture bugs through the API after each test, including when an assertion fails.
- Use the `loginPage` and `boardPage` fixtures from `tests/fixtures/page-objects.ts`; keep board selectors and style inspection behind `BoardPage`.
- Structure every test using Arrange–Act–Assert comments. Keep the tests focused on one observable severity behavior.

## Test Scenarios

### Board severity color-coding

**Seed:** `tests/seed.spec.ts`

#### 1. Displays each severity in its specified color

**File:** `tests/board-severity/board-severity-colors.spec.ts`

**Arrange:** Authenticate and create a unique HIGH, MID, and LOW bug.

**Act:** View the severity badges on the board.

**Assert:**

- Each fixture displays its matching uppercase severity label.
- HIGH text is `rgb(184, 74, 46)`, MID text is `rgb(166, 124, 71)`, and LOW text is `rgb(74, 107, 94)`, corresponding to the feature’s design colors.

#### 2. Uses the HIGH severity design token for the HIGH badge

**File:** `tests/board-severity/board-severity-colors.spec.ts`

**Arrange:** Authenticate and create all three severity fixtures, including a HIGH bug.

**Act:** Inspect the HIGH badge and its severity CSS rule.

**Assert:**

- The HIGH token is `#b84a2e`.
- The HIGH badge rule references `var(--color-severity-high)` for its text color and background tint.
- The displayed badge’s computed text color matches the HIGH design color.

#### 3. Makes severity levels visually distinct and emphasizes HIGH

**File:** `tests/board-severity/board-severity-colors.spec.ts`

**Arrange:** Authenticate and create one bug for each severity.

**Act:** Compare the computed badge styles for HIGH, MID, and LOW.

**Assert:**

- Each severity has a distinct computed text color and uses its corresponding severity color.
- Each badge uses the bolder `600` font weight and a tinted background with approximately 22% color opacity.
- HIGH uses the specified strong terracotta color, distinguishing it as the urgent severity.

#### 4. Defines severity badge colors through design tokens

**File:** `tests/board-severity/board-severity-colors.spec.ts`

**Arrange:** Load the authenticated board with all three severity fixtures.

**Act:** Inspect the root custom properties and the severity badge CSS rules.

**Assert:**

- The root defines `--color-severity-high: #b84a2e`, `--color-severity-mid: #a67c47`, and `--color-severity-low: #4a6b5e`.
- Each badge rule references its corresponding custom property for text color and background tint.
