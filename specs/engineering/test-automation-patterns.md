# Test automation patterns

These conventions apply to Playwright tests written for or maintained in this project. The project may introduce tests as course material; whenever tests are added or refactored, follow these patterns.

## Guiding Principles

- Keep each test focused on one behavior and independent of other tests.
- Follow Arrange–Act–Assert: establish the needed state, perform the behavior, then assert the observable result.
- Prefer user-visible, resilient locators and Playwright's auto-waiting and web-first assertions.
- Avoid fixed sleeps and brittle selectors when a role, label, text, or other stable locator is available.

## Architecture

Use the Page Object Model (POM) for all new and refactored Playwright tests. Tests should use page objects for page interactions instead of accumulating long raw `page` call chains. A page object represents an application page and centralizes its locators and user-facing operations, so UI details can change without requiring every test to change.

- Follow Playwright's [Page Object Model guidance](https://playwright.dev/docs/pom): pass a Playwright `Page` to the page object's constructor, retain it as an instance property, define page locators on the object, and provide methods for common user actions.
- Keep page-specific selectors and interaction details in the corresponding page object. Use meaningful locator and method names, and prefer methods that express user intent (for example, `logIn()` or `openBug()`) over generic wrappers around individual Playwright calls.
- Keep scenario setup, test flow, and expected outcomes in the test. Use Playwright's web-first `expect` assertions there; expose a page object's locator when the test needs to assert on page content or state.
- Keep page objects focused on UI behavior. Put shared non-UI test setup in appropriate fixtures or helpers rather than adding unrelated responsibilities to a page object.

## Page Object Fixtures

Create a Playwright test fixture for every page object. Tests must request page objects through fixtures and must not construct page objects directly.

- Store page object fixtures under `tests/fixtures/`.
- Define fixtures with Playwright's `test.extend()` pattern as documented in [Playwright fixtures](https://playwright.dev/docs/test-fixtures). Each fixture should construct its page object from the built-in `page` fixture and provide it with `await use(pageObject)`.
- Provide one named fixture for each page object class, including page-level dialogs. Keep the fixture type declarations aligned with the provided fixture names.
- Import `test` from the project's custom fixture module in every spec that needs page objects. Request only the page object fixtures used by that test; use fixture-provided instances rather than calling a constructor or creating another instance.
- Let Playwright manage the lifetime and isolation of fixtures per test. Do not share page object instances globally or retain them between tests.
- Keep fixtures focused on providing test dependencies. Put reusable actions in page objects and test-specific setup/assertions in the test or a focused helper.

## File Structure

- Put page object classes under `tests/pages/`.
- Create one page object class for each application page, such as the login, board, and bug pages.
- Keep each page object class in its own file; a file must contain no more than one page object class.
- Put all page object fixtures under `tests/fixtures/`.

## Preferred Locator Hierarchy

Choose the most user-facing, stable locator available, in this order:

1. `getByRole()` with an accessible role and name.
2. `getByLabel()` for form controls with an associated label.
3. `getByPlaceholder()` for controls whose placeholder is the clearest identifying text.
4. `getByText()` for visible non-interactive content, or `getByAltText()` / `getByTitle()` when those attributes describe the target.
5. `getByTestId()` when the element has no suitable user-facing locator or needs an explicit, stable test contract.
6. CSS selectors only when the options above do not fit. Avoid XPath and selectors tied to implementation details such as layout or styling.

Scope a locator to a meaningful parent when needed to distinguish matching elements. Avoid positional selection such as `nth()` unless the position itself is part of the behavior and the intent is clear.
