# Title Bar End-to-End Test Plan

## Coverage Assessment

The board is exercised throughout the suite, but no test verifies the title bar as a component. Some tests use New Bug or the search field without asserting the title bar's required branding and layout. Playwright CLI exploration showed a banner containing a BuggyBoard image, the BuggyBoard heading, Search, New Bug, and Logout controls. The title-bar acceptance criteria in `specs/features/04-title-bar.md` are not directly tested.

## Test Setup

- Authenticate with a valid account from `users.json`.
- Use the `boardPage` fixture; add only the page-object locators needed for banner assertions.
- Use semantic roles and accessible names rather than positional or styling selectors.
- Use Arrange–Act–Assert comments.

## Test Scenarios

### Title bar

#### 1. Displays the required brand and logout control in the specified layout

**File:** `tests/title-bar/displays-title-bar-branding.spec.ts`

**Arrange:** Authenticate and navigate to `/board`.

**Act:** Inspect the page banner.

**Assert:**

- The banner contains the BuggyBoard logo with an accessible name.
- The BuggyBoard heading appears beside the logo.
- The Logout button is visible and aligned to the right.
- The logo and title are left-aligned, with the title immediately to the right of the logo.
