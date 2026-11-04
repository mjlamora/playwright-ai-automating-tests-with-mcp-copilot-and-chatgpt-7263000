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
    fixtures.push(
      await createBug(page, `${testInfo.workerIndex}-${Date.now()}`),
    );
  });

  test.afterEach(async ({ page }) => {
    await cleanupBugs(page, fixtures);
  });

  test("deletes a newly created bug", async ({ page }) => {
    const [bug] = fixtures;
    if (!bug) {
      throw new Error("beforeEach must create a bug fixture.");
    }

    // 1. Create a fresh bug in beforeEach.
    const bugRow = page.getByRole("button").filter({ hasText: bug.title });
    await expect(bugRow).toBeVisible();

    // 2. Open the newly created bug.
    await bugRow.click();
    const dialog = page.getByRole("dialog");
    await expect(
      dialog.getByRole("heading", { name: `Edit bug #${bug.id}` }),
    ).toBeVisible();
    await expect(
      dialog.getByRole("button", { name: "Delete", exact: true }),
    ).toBeVisible();

    // 3. Delete the bug.
    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        new URL(response.url()).pathname === `/api/bugs/${bug.id}`,
    );
    await dialog.getByRole("button", { name: "Delete", exact: true }).click();
    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(204);
    await expect(dialog).toBeHidden();
    await expect(bugRow).toHaveCount(0);

    // 4. Reload to verify the bug remains deleted.
    await page.reload();
    await expect(
      page.getByRole("button").filter({ hasText: bug.title }),
    ).toHaveCount(0);
  });
});
