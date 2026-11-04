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

  test("saves a state change", async ({ page }) => {
    const boardPage = new BoardPage(page);
    // 1. Open the fixture and select Closed.
    const editBugDialog = await boardPage.openEditBug(fixture.title);
    await editBugDialog.stateSelect.selectOption("closed");

    // 2. Save the state change.
    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        new URL(response.url()).pathname === `/api/bugs/${fixture.id}`,
    );
    await editBugDialog.saveButton.click();
    const updateResponse = await updateResponsePromise;
    expect(updateResponse.status()).toBe(200);
    await expect(editBugDialog.dialog).toBeHidden();

    // 3. Select Closed in the board filter.
    await boardPage.stateFilterButton("Closed").click();
    await expect(boardPage.bugRow(fixture.title)).toBeVisible();

    // 4. Reload and verify the fixture appears only under Closed.
    await boardPage.reload();
    await boardPage.stateFilterButton("Closed").click();
    await expect(boardPage.bugRow(fixture.title)).toBeVisible();
    await boardPage.stateFilterButton("Open").click();
    await expect(boardPage.bugRow(fixture.title)).toHaveCount(0);
  });
});
