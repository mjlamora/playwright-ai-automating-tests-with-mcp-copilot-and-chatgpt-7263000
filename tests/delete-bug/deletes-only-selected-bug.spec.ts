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
    const suffix = `${testInfo.workerIndex}-${Date.now()}`;
    fixtures.push(
      await createBug(boardPage, createBugDialog, `${suffix}-first`),
    );
    fixtures.push(
      await createBug(boardPage, createBugDialog, `${suffix}-second`),
    );
  });

  test.afterEach(async ({ page }) => {
    await cleanupBugs(page, fixtures);
  });

  test("deletes only the selected bug", async ({ page, boardPage, editBugDialog }) => {
    const [deletedBug, remainingBug] = fixtures;
    if (!deletedBug || !remainingBug) {
      throw new Error("beforeEach must create two bug fixtures.");
    }

    // 1. Create two fresh bugs in beforeEach.
    const deletedBugRow = boardPage.bugRow(deletedBug.title);
    const remainingBugRow = boardPage.bugRow(remainingBug.title);
    await expect(deletedBugRow).toBeVisible();
    await expect(remainingBugRow).toBeVisible();

    // 2. Delete the first bug.
    await boardPage.openEditBug(deletedBug.title);
    await expect(editBugDialog.heading(deletedBug.id)).toBeVisible();
    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        new URL(response.url()).pathname === `/api/bugs/${deletedBug.id}`,
    );
    await editBugDialog.deleteButton.click();
    const deleteResponse = await deleteResponsePromise;
    expect(deleteResponse.status()).toBe(204);
    await expect(editBugDialog.dialog).toBeHidden();
    await expect(deletedBugRow).toHaveCount(0);
    await expect(remainingBugRow).toBeVisible();

    // 3. Reload to verify only the selected bug was deleted.
    await boardPage.reload();
    await expect(boardPage.bugRow(deletedBug.title)).toHaveCount(0);
    await expect(boardPage.bugRow(remainingBug.title)).toBeVisible();
  });
});
