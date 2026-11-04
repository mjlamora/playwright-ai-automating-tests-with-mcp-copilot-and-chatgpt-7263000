// spec: specs/testing/edit-bug.md
// seed: tests/seed.spec.ts
import { expect, test } from "@playwright/test";
import {
  cleanupBugs,
  createBug,
  type BugFixture,
  recordUpdateRequests,
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

  test("disables Save when the title is blank", async ({ page }) => {
    const boardPage = new BoardPage(page);
    // 1. Open the fixture and clear Title.
    const editBugDialog = await boardPage.openEditBug(fixture.title);
    const updateRequests = recordUpdateRequests(page);
    await editBugDialog.titleInput.fill("");
    await expect(editBugDialog.saveButton).toBeDisabled();
    await expect(editBugDialog.titleInput).toHaveValue("");
    expect(updateRequests).toHaveLength(0);

    await boardPage.reload();
    const reopenedDialog = await boardPage.openEditBug(fixture.title);
    await expect(reopenedDialog.titleInput).toHaveValue(fixture.title);
  });
});
