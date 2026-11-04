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
    fixture = await createBug(boardPage, createBugDialog, fixtures, "high");
  });

  test.afterEach(async ({ page }) => {
    await cleanupBugs(page, fixtures);
  });

  test("opens an existing bug with its current values", async ({ boardPage, editBugDialog }) => {
    // 1. Click the row for the newly created bug.
    await boardPage.openEditBug(fixture.title);
    await expect(editBugDialog.dialog).toBeVisible();
    await expect(editBugDialog.heading(fixture.id)).toBeVisible();
    await expect(editBugDialog.idInput).toHaveValue(String(fixture.id));
    await expect(editBugDialog.titleInput).toHaveValue(fixture.title);
    await expect(editBugDialog.severitySelect).toHaveValue(fixture.severity);
    await expect(editBugDialog.stateSelect).toHaveValue(fixture.state);
    await expect(editBugDialog.ownerInput).toHaveValue(fixture.owner);
    await expect(editBugDialog.descriptionInput).toHaveValue(fixture.description);
    await expect(editBugDialog.saveButton).toBeVisible();
    await expect(editBugDialog.cancelButton).toBeVisible();
  });
});
