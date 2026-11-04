import { expect, test } from "./fixtures/page-objects";

test("has title", async ({ page, playwrightDevPage }) => {
  await playwrightDevPage.goto();

  await expect(page).toHaveTitle(/Playwright/);
});

test("get started link", async ({ playwrightDevPage }) => {
  await playwrightDevPage.goto();

  await playwrightDevPage.openGettingStarted();

  await expect(playwrightDevPage.installationHeading).toBeVisible();
});
