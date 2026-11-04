// spec: specs/testing/edit-bug.md
// seed: tests/seed.spec.ts
import { expect, test } from "@playwright/test";
import {
  bugRow,
  cleanupBugs,
  createBug,
  type BugFixture,
  signIn,
} from "./edit-bug-setup";

test.describe("Edit bug", () => {
  let fixtures: BugFixture[] = [];
  let fixture: BugFixture;

  test.beforeEach(async ({ page }) => {
    fixtures = [];
    await signIn(page);
    fixture = await createBug(page, fixtures);
  });

  test.afterEach(async ({ page }) => {
    await cleanupBugs(page, fixtures);
  });

  test("saves a state change", async ({ page }) => {
    // 1. Open the fixture and select Closed.
    await bugRow(page, fixture.title).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("State").selectOption("closed");

    // 2. Save the state change.
    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        new URL(response.url()).pathname === `/api/bugs/${fixture.id}`,
    );
    await dialog.getByRole("button", { name: "Save" }).click();
    const updateResponse = await updateResponsePromise;
    expect(updateResponse.status()).toBe(200);
    await expect(dialog).toBeHidden();

    // 3. Select Closed in the board filter.
    const stateFilter = page.getByRole("group", {
      name: "Filter by bug state",
    });
    await stateFilter.getByRole("button", { name: "Closed" }).click();
    await expect(bugRow(page, fixture.title)).toBeVisible();

    // 4. Reload and verify the fixture appears only under Closed.
    await page.reload();
    const reloadedFilter = page.getByRole("group", {
      name: "Filter by bug state",
    });
    await reloadedFilter.getByRole("button", { name: "Closed" }).click();
    await expect(bugRow(page, fixture.title)).toBeVisible();
    await reloadedFilter.getByRole("button", { name: "Open" }).click();
    await expect(bugRow(page, fixture.title)).toHaveCount(0);
  });
});
