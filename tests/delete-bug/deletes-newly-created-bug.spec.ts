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
    // Arrange: sign in and create a fixture bug.
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
    // Arrange: the fixture bug is created in beforeEach.
    const [bug] = fixtures;
    if (!bug) {
      throw new Error("beforeEach must create a bug fixture.");
    }

    const bugRow = boardPage.bugRow(bug.title);

    // Assert: the fixture bug is initially visible.
    await expect(bugRow).toBeVisible();

    // Act: open the newly created bug.
    await boardPage.openEditBug(bug.title);

    // Assert: the edit dialog identifies the bug and offers Delete.
    await expect(editBugDialog.heading(bug.id)).toBeVisible();
    await expect(editBugDialog.deleteButton).toBeVisible();

    // Act: delete the bug.
    const deleteResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "DELETE" &&
        new URL(response.url()).pathname === `/api/bugs/${bug.id}`,
    );
    await editBugDialog.deleteButton.click();
    const deleteResponse = await deleteResponsePromise;

    // Assert: deletion succeeds and the bug is removed.
    expect(deleteResponse.status()).toBe(204);
    await expect(editBugDialog.dialog).toBeHidden();
    await expect(bugRow).toHaveCount(0);

    // Act: reload the board.
    await boardPage.reload();

    // Assert: the deleted bug remains absent.
    await expect(boardPage.bugRow(bug.title)).toHaveCount(0);
  });
});
