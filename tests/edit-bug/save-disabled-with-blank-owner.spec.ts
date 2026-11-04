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
    fixtures = [];
    await signIn(loginPage);
    fixture = await createBug(boardPage, createBugDialog, fixtures);
  });

  test.afterEach(async ({ page }) => {
    await cleanupBugs(page, fixtures);
  });

  test("disables Save when the owner is blank", async ({ boardPage, editBugDialog }) => {
    // 1. Open the fixture and clear Owner.
    await boardPage.openEditBug(fixture.title);
    await editBugDialog.ownerInput.fill("");
    await expect(editBugDialog.saveButton).toBeDisabled();
    await expect(editBugDialog.ownerInput).toHaveValue("");

    await boardPage.reload();
    await boardPage.openEditBug(fixture.title);
    const reopenedDialog = editBugDialog;
    await expect(reopenedDialog.ownerInput).toHaveValue(fixture.owner);
  });
});
