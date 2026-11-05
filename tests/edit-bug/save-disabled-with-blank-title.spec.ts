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

  test("disables Save when the title is blank", async ({ page, boardPage, editBugDialog }) => {
    // Arrange: the fixture bug is created in beforeEach.

    // Act: open the bug and clear its title.
    await boardPage.openEditBug(fixture.title);
    const updateRequests = recordUpdateRequests(page);
    await editBugDialog.titleInput.fill("");

    // Assert: Save is disabled and no update is sent.
    await expect(editBugDialog.saveButton).toBeDisabled();
    await expect(editBugDialog.titleInput).toHaveValue("");
    expect(updateRequests).toHaveLength(0);

    // Act: reload and reopen the bug.
    await boardPage.reload();
    await boardPage.openEditBug(fixture.title);
    const reopenedDialog = editBugDialog;

    // Assert: the original title was not changed.
    await expect(reopenedDialog.titleInput).toHaveValue(fixture.title);
  });
});
