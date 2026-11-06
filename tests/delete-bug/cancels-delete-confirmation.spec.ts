import { randomUUID } from "node:crypto";
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

  test.beforeEach(async ({ loginPage, boardPage, createBugDialog }) => {
    // Arrange: sign in and create a fixture bug.
    fixtures = [];
    await signIn(loginPage);
    fixtures.push(
      await createBug(
        boardPage,
        createBugDialog,
        randomUUID(),
      ),
    );
  });

  test.afterEach(async ({ page }) => {
    await cleanupBugs(page, fixtures);
  });

  test("dismisses deletion confirmation without changing the bug", async ({
    page,
    boardPage,
    editBugDialog,
  }) => {
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
    const originalValues = await Promise.all([
      editBugDialog.titleInput.inputValue(),
      editBugDialog.severitySelect.inputValue(),
      editBugDialog.stateSelect.inputValue(),
      editBugDialog.ownerInput.inputValue(),
      editBugDialog.descriptionInput.inputValue(),
    ]);

    // Act: open the delete confirmation and dismiss it without confirming.
    let deleteRequestCount = 0;
    const trackDeleteRequest = (request: { method(): string; url(): string }) => {
      if (
        request.method() === "DELETE" &&
        new URL(request.url()).pathname === `/api/bugs/${bug.id}`
      ) {
        deleteRequestCount += 1;
      }
    };
    page.on("request", trackDeleteRequest);
    await editBugDialog.deleteButton.click();
    await expect(editBugDialog.deleteConfirmation).toBeVisible();
    await expect(editBugDialog.deleteConfirmation).toContainText(
      `bug #${bug.id}`,
    );

    // Assert: clicking the backdrop does not dismiss or confirm deletion.
    await editBugDialog.clickDeleteConfirmationBackdrop();
    await expect(editBugDialog.deleteConfirmation).toBeVisible();

    // Act: close with the X, then reopen and dismiss with Escape.
    await editBugDialog.closeDeleteConfirmationButton.click();
    await editBugDialog.deleteButton.click();
    await editBugDialog.closeWithEscape();
    await editBugDialog.deleteButton.click();
    await editBugDialog.cancelDeleteButton.click();

    // Assert: each dismissal returns to editing without a delete request or data loss.
    page.off("request", trackDeleteRequest);
    expect(deleteRequestCount).toBe(0);
    await expect(editBugDialog.deleteConfirmation).toBeHidden();
    await expect(editBugDialog.dialog).toBeVisible();
    await expect(editBugDialog.titleInput).toHaveValue(originalValues[0]);
    await expect(editBugDialog.severitySelect).toHaveValue(originalValues[1]);
    await expect(editBugDialog.stateSelect).toHaveValue(originalValues[2]);
    await expect(editBugDialog.ownerInput).toHaveValue(originalValues[3]);
    await expect(editBugDialog.descriptionInput).toHaveValue(originalValues[4]);

    // Act: close the edit modal and reload the board.
    await editBugDialog.cancelButton.click();
    await boardPage.reload();

    // Assert: the bug remains unchanged and visible.
    await expect(boardPage.bugRow(bug.title)).toBeVisible();
  });
});
