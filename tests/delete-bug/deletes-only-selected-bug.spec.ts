import { expect, test } from "@playwright/test";
import {
  cleanupBugs,
  createBug,
  type BugFixture,
  signIn,
} from "./delete-bug-setup";

test.describe("Delete bug", () => {
  let fixtures: BugFixture[] = [];

  test.beforeEach(async ({ page }, testInfo) => {
    fixtures = [];
    await signIn(page);
    const suffix = `${testInfo.workerIndex}-${Date.now()}`;
    fixtures.push(await createBug(page, `${suffix}-first`));
    fixtures.push(await createBug(page, `${suffix}-second`));
  });

  test.afterEach(async ({ page }) => {
    await cleanupBugs(page, fixtures);
  });

  test("deletes only the selected bug", async ({ page }) => {
    const [deletedBug, remainingBug] = fixtures;
    if (!deletedBug || !remainingBug) {
      throw new Error("beforeEach must create two bug fixtures.");
    }

    // 1. Create two fresh bugs in beforeEach.
    const deletedBugRow = page
      .getByRole("button")
      .filter({ hasText: deletedBug.title });
    const remainingBugRow = page
      .getByRole("button")
      .filter({ hasText: remainingBug.title });
    await expect(deletedBugRow).toBeVisible();
    await expect(remainingBugRow).toBeVisible();

    // 2. Delete the first bug.
    await deletedBugRow.click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: `Edit bug #${deletedBug.id}` }),
    ).toBeVisible();
    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        new URL(response.url()).pathname === `/api/bugs/${deletedBug.id}`,
    );
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(204);
    await expect(dialog).toBeHidden();
    await expect(deletedBugRow).toHaveCount(0);
    await expect(remainingBugRow).toBeVisible();

    // 3. Reload to verify only the selected bug was deleted.
    await page.reload();
    await expect(
      page.getByRole("button").filter({ hasText: deletedBug.title }),
    ).toHaveCount(0);
    await expect(
      page.getByRole("button").filter({ hasText: remainingBug.title }),
    ).toBeVisible();
  });
});
