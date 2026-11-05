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

  test("preserves edits when clicking the backdrop", async ({ page, boardPage, editBugDialog }) => {
    // Arrange: the fixture bug is created in beforeEach.

    // Act: open the bug and make unsaved edits.
    await boardPage.openEditBug(fixture.title);
    const changedTitle = `${fixture.title}-unsaved`;
    const changedDescription = "Unsaved description change";
    await editBugDialog.titleInput.fill(changedTitle);
    await editBugDialog.descriptionInput.fill(changedDescription);
    const updateRequests = recordUpdateRequests(page);

    // Act: click the dimmed backdrop outside the modal panel.
    await editBugDialog.clickBackdrop();

    // Assert: the modal and edits remain, and no update was sent.
    await expect(editBugDialog.dialog).toBeVisible();
    await expect(editBugDialog.titleInput).toHaveValue(changedTitle);
    await expect(editBugDialog.descriptionInput).toHaveValue(changedDescription);
    expect(updateRequests).toHaveLength(0);
  });
});
