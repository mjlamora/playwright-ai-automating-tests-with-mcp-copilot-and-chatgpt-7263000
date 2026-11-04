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
    fixtures = [];
    await signIn(loginPage);
    fixture = await createBug(boardPage, createBugDialog, fixtures);
  });

  test.afterEach(async ({ page }) => {
    await cleanupBugs(page, fixtures);
  });

  test("closes with Escape without saving edits", async ({ page, boardPage, editBugDialog }) => {
    // 1. Open the fixture and change its title.
    await boardPage.openEditBug(fixture.title);
    await editBugDialog.titleInput.fill(`${fixture.title}-unsaved`);
    const updateRequests = recordUpdateRequests(page);

    // 2. Press Escape.
    await editBugDialog.closeWithEscape();
    await expect(editBugDialog.dialog).toBeHidden();
    expect(updateRequests).toHaveLength(0);

    // 3. Reopen to verify the original values.
    await boardPage.openEditBug(fixture.title);
    const reopenedDialog = editBugDialog;
    await expect(reopenedDialog.titleInput).toHaveValue(fixture.title);
    await expect(reopenedDialog.severitySelect).toHaveValue(fixture.severity);
    await expect(reopenedDialog.stateSelect).toHaveValue(fixture.state);
    await expect(reopenedDialog.ownerInput).toHaveValue(fixture.owner);
    await expect(reopenedDialog.descriptionInput).toHaveValue(fixture.description);
  });
});
