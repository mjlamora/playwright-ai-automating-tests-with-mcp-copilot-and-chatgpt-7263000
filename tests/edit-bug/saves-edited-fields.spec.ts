// spec: specs/testing/edit-bug.md
// seed: tests/seed.spec.ts
import { expect } from "@playwright/test";
import { test } from "../fixtures/page-objects";
import {
  cleanupBugs,
  createBug,
  type BugFixture,
  signIn,
} from "./edit-bug-setup";

test.describe("Edit bug", () => {
  let fixtures: BugFixture[] = [];
  let fixture: BugFixture;

  test.beforeEach(async ({ loginPage, boardPage, createBugDialog }) => {
    // Arrange: sign in and create a fixture bug.
    fixtures = [];
    await signIn(loginPage);
    fixture = await createBug(boardPage, createBugDialog, fixtures);
  });

  test.afterEach(async ({ page }) => {
    await cleanupBugs(page, fixtures);
  });

  test("saves edited fields and preserves them after reload", async ({
    page,
    boardPage,
    editBugDialog,
  }) => {
    // Arrange: the fixture bug is created in beforeEach.

    // Act: open the bug, update its editable fields, and save.
    await boardPage.openEditBug(fixture.title);
    const updated = {
      title: `${fixture.title}-updated`,
      severity: "low",
      owner: "updated-owner",
      description: "Updated description persisted by the edit form",
    };
    await editBugDialog.titleInput.fill(updated.title);
    await editBugDialog.severitySelect.selectOption(updated.severity);
    await editBugDialog.ownerInput.fill(updated.owner);
    await editBugDialog.descriptionInput.fill(updated.description);

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        new URL(response.url()).pathname === `/api/bugs/${fixture.id}`,
    );
    await editBugDialog.saveButton.click();
    const updateResponse = await updateResponsePromise;

    // Assert: the update succeeds and the board shows the changed values.
    expect(updateResponse.status()).toBe(200);
    await expect(editBugDialog.dialog).toBeHidden();

    await expect(boardPage.bugRow(updated.title)).toBeVisible();
    await expect(
      boardPage.bugSeverityCell(updated.title, "LOW"),
    ).toBeVisible();
    await expect(boardPage.bugOwnerCell(updated.title, updated.owner)).toBeVisible();

    // Act: reload and reopen the updated bug.
    await boardPage.reload();
    await boardPage.openEditBug(updated.title);
    const reopenedDialog = editBugDialog;

    // Assert: the saved values persist after reload.
    await expect(reopenedDialog.idInput).toHaveValue(String(fixture.id));
    await expect(reopenedDialog.titleInput).toHaveValue(updated.title);
    await expect(reopenedDialog.severitySelect).toHaveValue(updated.severity);
    await expect(reopenedDialog.ownerInput).toHaveValue(updated.owner);
    await expect(reopenedDialog.descriptionInput).toHaveValue(updated.description);
  });
});
