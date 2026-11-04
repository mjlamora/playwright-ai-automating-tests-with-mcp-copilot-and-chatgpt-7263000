// spec: specs/testing/edit-bug.md
// seed: tests/seed.spec.ts
import { expect, test } from "@playwright/test";
import {
  cleanupBugs,
  createBug,
  type BugFixture,
  signIn,
} from "./edit-bug-setup";
import { BoardPage } from "../pages/BoardPage";

test.describe("Edit bug", () => {
  let fixtures: BugFixture[] = [];
  let fixture: BugFixture;

  test.beforeEach(async ({ page }) => {
    fixtures = [];
    await signIn(page);
    fixture = await createBug(page, fixtures, "high");
  });

  test.afterEach(async ({ page }) => {
    await cleanupBugs(page, fixtures);
  });

  test("opens an existing bug with its current values", async ({ page }) => {
    const boardPage = new BoardPage(page);
    // 1. Click the row for the newly created bug.
    const editBugDialog = await boardPage.openEditBug(fixture.title);
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
