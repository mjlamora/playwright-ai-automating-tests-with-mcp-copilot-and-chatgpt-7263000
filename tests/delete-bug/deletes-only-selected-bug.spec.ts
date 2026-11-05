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
    // Arrange: sign in and create two fixture bugs.
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
    // Arrange: the two fixture bugs are created in beforeEach.
    const [deletedBug, remainingBug] = fixtures;
    if (!deletedBug || !remainingBug) {
      throw new Error("beforeEach must create two bug fixtures.");
    }

    const deletedBugRow = boardPage.bugRow(deletedBug.title);
    const remainingBugRow = boardPage.bugRow(remainingBug.title);

    // Assert: both fixture bugs are initially visible.
    await expect(deletedBugRow).toBeVisible();
    await expect(remainingBugRow).toBeVisible();

    // Act: open the selected bug and request deletion.
    await boardPage.openEditBug(deletedBug.title);
    await expect(editBugDialog.heading(deletedBug.id)).toBeVisible();
    await editBugDialog.deleteButton.click();

    // Assert: deletion waits for explicit confirmation.
    await expect(editBugDialog.deleteConfirmation).toBeVisible();
    await expect(deletedBugRow).toBeVisible();

    // Act: confirm deletion of the selected bug.
    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        new URL(response.url()).pathname === `/api/bugs/${deletedBug.id}`,
    );
    await editBugDialog.confirmDeleteButton.click();
    const deleteResponse = await deleteResponsePromise;

    // Assert: confirmation removes only the selected bug.
    expect(deleteResponse.status()).toBe(204);
    await expect(editBugDialog.dialog).toBeHidden();
    await expect(deletedBugRow).toHaveCount(0);
    await expect(remainingBugRow).toBeVisible();

    // Act: reload the board.
    await boardPage.reload();

    // Assert: the selected bug stays deleted and the other remains.
    await expect(boardPage.bugRow(deletedBug.title)).toHaveCount(0);
    await expect(boardPage.bugRow(remainingBug.title)).toBeVisible();
  });
});
