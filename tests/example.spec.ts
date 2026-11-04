import { expect, test } from "@playwright/test";
import { PlaywrightDevPage } from "./pages/PlaywrightDevPage";

test("has title", async ({ page }) => {
  const playwrightDevPage = new PlaywrightDevPage(page);
  await playwrightDevPage.goto();

  await expect(page).toHaveTitle(/Playwright/);
});

test("get started link", async ({ page }) => {
  const playwrightDevPage = new PlaywrightDevPage(page);
  await playwrightDevPage.goto();

  await playwrightDevPage.openGettingStarted();

  await expect(playwrightDevPage.installationHeading).toBeVisible();
});
