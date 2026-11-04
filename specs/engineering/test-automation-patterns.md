# Test automation patterns

These conventions apply to Playwright tests written for or maintained in this project. The project may introduce tests as course material; whenever tests are added or refactored, follow these patterns.

## Page Object Model

Use the Page Object Model (POM) for all new and refactored Playwright tests. Tests should use page objects for page interactions instead of accumulating long chains of raw `page` calls. A page object represents a page in the application and centralizes its locators and user-facing operations, so UI details can change without requiring every test to change.

- Put page object classes under `tests/pages/`.
- Create a separate page object class for each application page, such as the login, board, and bug pages.
- Keep each page object class in its own file. A file must contain no more than one page object class.
- Follow Playwright's [Page Object Model guidance](https://playwright.dev/docs/pom): accept a Playwright `Page` in the constructor, retain it as an instance property, define the page's locators on the object, and provide methods for common actions on that page.
- Use meaningful names for classes, files, locators, and methods. Prefer methods that express user intent (for example, `logIn()` or `openBug()`) over generic wrappers around individual Playwright calls.
- Keep page-specific selectors and interaction details in that page's object. Avoid duplicating the same interaction logic across tests.
- Keep scenario setup, test flow, and expected outcomes in the test. Use Playwright's web-first `expect` assertions there; expose a page object's locator when the test needs to assert on page content or state.
- Keep page objects focused on UI behavior. Put shared non-UI test setup in appropriate fixtures or helpers rather than adding unrelated responsibilities to a page object.

## Test structure

- Keep each test focused on one behavior and independent of other tests.
- Follow Arrange–Act–Assert: establish the needed state, perform the behavior, then assert the observable result.
- Prefer user-visible locators and Playwright's auto-waiting and web-first assertions. Avoid fixed sleeps and brittle selectors when a role, label, text, or other stable locator is available.