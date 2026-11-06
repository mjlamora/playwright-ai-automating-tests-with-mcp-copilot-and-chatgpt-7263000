import { expect, test } from "./fixtures/page-objects";

test("has title", async ({ page, playwrightDevPage }) => {
  // Arrange: navigate to the Playwright documentation site.
  await playwrightDevPage.goto();

  // Assert: the document title identifies Playwright.
  await expect(page).toHaveTitle(/Playwright/);
});

test("get started link", async ({ playwrightDevPage }) => {
  // Arrange: navigate to the Playwright documentation site.
  await playwrightDevPage.goto();

  // Act: follow the Get started link.
  await playwrightDevPage.openGettingStarted();

  // Assert: the installation page is shown.
  await expect(playwrightDevPage.installationHeading).toBeVisible();
});
