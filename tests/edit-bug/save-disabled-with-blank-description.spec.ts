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
    fixture = await createBug(page, fixtures);
  });

  test.afterEach(async ({ page }) => {
    await cleanupBugs(page, fixtures);
  });

  test("disables Save when the description is blank", async ({ page }) => {
    const boardPage = new BoardPage(page);
    // 1. Open the fixture and clear Description.
    const editBugDialog = await boardPage.openEditBug(fixture.title);
    await editBugDialog.descriptionInput.fill("");
    await expect(editBugDialog.saveButton).toBeDisabled();
    await expect(editBugDialog.descriptionInput).toHaveValue("");

    await boardPage.reload();
    const reopenedDialog = await boardPage.openEditBug(fixture.title);
    await expect(reopenedDialog.descriptionInput).toHaveValue(fixture.description);
  });
});
