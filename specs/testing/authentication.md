# Authentication End-to-End Test Plan

## Coverage Assessment

The current suite's only direct authentication test is `tests/seed.spec.ts`, which verifies that valid credentials reach `/board`. Other tests also sign in as setup, but they do not independently verify login behavior. Playwright CLI exploration confirmed the `/login` form, a generic invalid-credentials alert, a combined blank-credentials alert, Enter-key submission, and redirect from a protected `/board` route to `/login`. The login acceptance criteria in `specs/features/03-login.md` are otherwise untested. The login page snapshot did not expose the logo required by that feature's design, so the planned logo assertion may reveal an implementation gap rather than only a test gap.

## Test Setup

- Read valid test accounts from the repository's `users.json`; do not hard-code credentials in new tests.
- Use the `loginPage` fixture from `tests/fixtures/page-objects.ts`.
- Start each test unauthenticated. Use an isolated browser context as provided by Playwright.
- Keep each test focused on one login behavior and use Arrange–Act–Assert comments.

## Test Scenarios

### Login

#### 1. Displays the login form

**File:** `tests/authentication/displays-login-form.spec.ts`

**Arrange:** Start with a logged-out browser.

**Act:** Navigate to `/login`.

**Assert:**

- Username and Password fields and the Login button are visible.
- The password field masks entered text.
- The login page displays the BuggyBoard logo as required by the login design.

#### 2. Redirects unauthenticated users from protected pages

**File:** `tests/authentication/redirects-unauthenticated-users.spec.ts`

**Arrange:** Start with no authenticated session.

**Act:** Navigate directly to `/board`.

**Assert:** The browser lands on `/login` and protected board content is not displayed.

#### 3. Logs in with valid credentials

**File:** `tests/authentication/logs-in-with-valid-credentials.spec.ts`

**Arrange:** Load a valid account from `users.json` and navigate to `/login`.

**Act:** Enter the account credentials and click Login.

**Assert:** The user reaches `/board` and authenticated board content is visible.

#### 4. Submits when Enter is pressed in either credential field

**File:** `tests/authentication/submits-login-on-enter.spec.ts`

**Arrange:** Use valid credentials and open `/login`.

**Act:** In separate test cases, focus Username or Password and press Enter to submit.

**Assert:** Both cases authenticate successfully and navigate to `/board`.

#### 5. Shows a generic error for invalid credentials

**File:** `tests/authentication/rejects-invalid-credentials.spec.ts`

**Arrange:** Open `/login`.

**Act:** Separately submit an unknown username with a nonblank password, and a valid username with an incorrect password.

**Assert:** Neither attempt authenticates; both show the same generic invalid-credentials alert and remain on `/login`.

#### 6. Validates missing credentials

**File:** `tests/authentication/validates-blank-credentials.spec.ts`

**Arrange:** Open `/login`.

**Act:** In separate test cases, submit a blank username, a blank password, and both fields blank.

**Assert:** Each attempt remains unauthenticated and displays the corresponding blank-credential feedback specified in the login feature.

#### 7. Trims surrounding whitespace from the username

**File:** `tests/authentication/trims-username-whitespace.spec.ts`

**Arrange:** Load a valid account from `users.json`.

**Act:** Submit its username with leading and trailing whitespace and its correct password.

**Assert:** Login succeeds and the browser navigates to `/board`.

#### 8. Redirects an authenticated user away from Login

**File:** `tests/authentication/redirects-authenticated-users-from-login.spec.ts`

**Arrange:** Authenticate with a valid account.

**Act:** Navigate to `/login`.

**Assert:** The user is redirected to `/board`.

#### 9. Keeps an authenticated session after reload

**File:** `tests/authentication/persists-authenticated-session.spec.ts`

**Arrange:** Authenticate with a valid account and confirm `/board`.

**Act:** Reload the page.

**Assert:** The user remains authenticated on `/board`.
