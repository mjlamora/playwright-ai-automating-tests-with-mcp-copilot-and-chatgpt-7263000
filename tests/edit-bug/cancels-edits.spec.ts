// spec: specs/testing/edit-bug.md
// seed: tests/seed.spec.ts
import { expect } from "@playwright/test";
import { test } from "../fixtures/page-objects";
import {
  cleanupBugs,
  createBug,
  type BugFixture,
  recordUpdateRequests,
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

  test("cancels edits without saving", async ({ page, boardPage, editBugDialog }) => {
    // Arrange: the fixture bug is created in beforeEach.

    // Act: open the bug, make edits, and cancel them.
    await boardPage.openEditBug(fixture.title);
    await editBugDialog.titleInput.fill(`${fixture.title}-unsaved`);
    await editBugDialog.descriptionInput.fill("Unsaved description change");
    const updateRequests = recordUpdateRequests(page);

    await editBugDialog.cancelButton.click();

    // Assert: the dialog closes without sending an update.
    await expect(editBugDialog.dialog).toBeHidden();
    expect(updateRequests).toHaveLength(0);

    // Act: reload and reopen the unchanged bug.
    await boardPage.reload();
    await boardPage.openEditBug(fixture.title);
    const reopenedDialog = editBugDialog;

    // Assert: all original values are still present.
    await expect(reopenedDialog.titleInput).toHaveValue(fixture.title);
    await expect(reopenedDialog.severitySelect).toHaveValue(fixture.severity);
    await expect(reopenedDialog.stateSelect).toHaveValue(fixture.state);
    await expect(reopenedDialog.ownerInput).toHaveValue(fixture.owner);
    await expect(reopenedDialog.descriptionInput).toHaveValue(fixture.description);
  });
});
