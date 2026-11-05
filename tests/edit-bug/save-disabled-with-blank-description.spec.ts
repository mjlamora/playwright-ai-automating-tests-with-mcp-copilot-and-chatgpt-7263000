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

  test("disables Save when the description is blank", async ({ boardPage, editBugDialog }) => {
    // Arrange: the fixture bug is created in beforeEach.

    // Act: open the bug and clear its description.
    await boardPage.openEditBug(fixture.title);
    await editBugDialog.descriptionInput.fill("");

    // Assert: Save is disabled for a blank description.
    await expect(editBugDialog.saveButton).toBeDisabled();
    await expect(editBugDialog.descriptionInput).toHaveValue("");

    // Act: reload and reopen the bug.
    await boardPage.reload();
    await boardPage.openEditBug(fixture.title);
    const reopenedDialog = editBugDialog;

    // Assert: the original description was not changed.
    await expect(reopenedDialog.descriptionInput).toHaveValue(fixture.description);
  });
});
