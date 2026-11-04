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

  test("preserves edits when clicking the backdrop", async ({ page }) => {
    const boardPage = new BoardPage(page);
    // 1. Open the fixture and change its title and description.
    const editBugDialog = await boardPage.openEditBug(fixture.title);
    const changedTitle = `${fixture.title}-unsaved`;
    const changedDescription = "Unsaved description change";
    await editBugDialog.titleInput.fill(changedTitle);
    await editBugDialog.descriptionInput.fill(changedDescription);
    const updateRequests = recordUpdateRequests(page);

    // 2. Click the dimmed backdrop outside the modal panel.
    await editBugDialog.clickBackdrop();
    await expect(editBugDialog.dialog).toBeVisible();
    await expect(editBugDialog.titleInput).toHaveValue(changedTitle);
    await expect(editBugDialog.descriptionInput).toHaveValue(changedDescription);
    expect(updateRequests).toHaveLength(0);
  });
});
