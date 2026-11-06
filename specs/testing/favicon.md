# Favicon End-to-End Test Plan

## Coverage Assessment

There are no favicon assertions in the current Playwright suite. The feature spec `specs/features/01-favicon.md` requires the app to reference `frontend/public/favicon.ico` and describes its artwork as a tan cartoon 1970 Volkswagen Beetle. Playwright CLI inspection confirmed the app document references `/favicon.ico`; the asset's visual artwork has not been validated by an automated test.

## Test Setup

- Test a top-level BuggyBoard page using the existing Playwright configuration.
- Keep the check independent of authentication by using `/login`.
- Use the `loginPage` fixture and keep favicon metadata access in the page object, following the project's Page Object Model conventions.
- Use Arrange–Act–Assert comments.

## Test Scenarios

### Favicon

#### 1. References and serves the application favicon

**File:** `tests/favicon/references-served-favicon.spec.ts`

**Arrange:** Navigate to `/login`.

**Act:** Read the document's favicon link and request the referenced URL.

**Assert:**

- A favicon link references `/favicon.ico`.
- The request succeeds and returns an ICO-compatible response.
- The referenced file corresponds to `frontend/public/favicon.ico`.

## Manual Visual Acceptance

Review the served asset in an image viewer or browser tab and confirm that it depicts a tan-colored, cartoon-style 1970 Volkswagen Beetle. Its subject and style cannot be inferred from a successful HTTP response alone.
