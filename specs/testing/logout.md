# Logout End-to-End Test Plan

## Coverage Assessment

No current Playwright test clicks Logout or checks authentication after logout. Playwright CLI exploration confirmed that the board title bar exposes a Logout button and that clicking it navigates to `/login`. The remaining logout and history behaviors in `specs/features/05-logout.md` are not tested.

## Test Setup

- Load valid credentials from `users.json` and authenticate using the `loginPage` fixture.
- Use the `boardPage` and `loginPage` fixtures from `tests/fixtures/page-objects.ts`.
- Keep tests isolated; do not depend on session state from another test.
- Use Arrange–Act–Assert comments.

## Test Scenarios

### Logout

#### 1. Logs out and redirects to Login

**File:** `tests/logout/logs-out-and-redirects-to-login.spec.ts`

**Arrange:** Authenticate and verify that `/board` is displayed.

**Act:** Click Logout.

**Assert:** The browser navigates to `/login`, and login controls are visible.

#### 2. Blocks protected content after logout

**File:** `tests/logout/blocks-board-after-logout.spec.ts`

**Arrange:** Authenticate, then log out.

**Act:** Navigate directly to `/board`.

**Assert:** The user is redirected to `/login`; board content is not available.

#### 3. Does not restore authentication through browser history

**File:** `tests/logout/does-not-restore-session-with-back-button.spec.ts`

**Arrange:** Authenticate and log out, leaving the browser on `/login`.

**Act:** Use the browser Back button.

**Assert:** The user remains unauthenticated; protected content is not restored and any protected-page navigation resolves to `/login`.
