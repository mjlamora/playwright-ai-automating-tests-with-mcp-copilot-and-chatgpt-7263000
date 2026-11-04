import { expect } from "@playwright/test";
import { test } from "../fixtures/page-objects";
import {
  cleanupBugs,
  createBug,
  type BugFixture,
  signIn,
} from "./delete-bug-setup";

test.describe("Delete bug", () => {
  let fixtures: BugFixture[] = [];

  test.beforeEach(async ({ loginPage, boardPage, createBugDialog }, testInfo) => {
    fixtures = [];
    await signIn(loginPage);
    fixtures.push(
      await createBug(
        boardPage,
        createBugDialog,
        `${testInfo.workerIndex}-${Date.now()}`,
      ),
    );
  });

  test.afterEach(async ({ page }) => {
    await cleanupBugs(page, fixtures);
  });

  test("deletes a newly created bug", async ({ page, boardPage, editBugDialog }) => {
    const [bug] = fixtures;
    if (!bug) {
      throw new Error("beforeEach must create a bug fixture.");
    }

    // 1. Create a fresh bug in beforeEach.
    const bugRow = boardPage.bugRow(bug.title);
    await expect(bugRow).toBeVisible();

    // 2. Open the newly created bug.
    await boardPage.openEditBug(bug.title);
    await expect(editBugDialog.heading(bug.id)).toBeVisible();
    await expect(editBugDialog.deleteButton).toBeVisible();

    // 3. Delete the bug.
    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        new URL(response.url()).pathname === `/api/bugs/${bug.id}`,
    );
    await editBugDialog.deleteButton.click();
    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(204);
    await expect(editBugDialog.dialog).toBeHidden();
    await expect(bugRow).toHaveCount(0);

    // 4. Reload to verify the bug remains deleted.
    await boardPage.reload();
    await expect(boardPage.bugRow(bug.title)).toHaveCount(0);
  });
});
