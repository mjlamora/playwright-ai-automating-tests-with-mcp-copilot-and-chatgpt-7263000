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
    // Arrange: sign in and create a fixture bug.
    fixtures = [];
    await signIn(loginPage);
    fixture = await createBug(boardPage, createBugDialog, fixtures);
  });

  test.afterEach(async ({ page }) => {
    await cleanupBugs(page, fixtures);
  });

  test("saves a state change", async ({ page, boardPage, editBugDialog }) => {
    // Arrange: the fixture bug is created in beforeEach.

    // Act: open the bug, change its state, and save.
    await boardPage.openEditBug(fixture.title);
    await editBugDialog.stateSelect.selectOption("closed");

    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        new URL(response.url()).pathname === `/api/bugs/${fixture.id}`,
    );
    await editBugDialog.saveButton.click();
    const updateResponse = await updateResponsePromise;

    // Assert: the update succeeds.
    expect(updateResponse.status()).toBe(200);
    await expect(editBugDialog.dialog).toBeHidden();

    // Act: filter the board to Closed bugs.
    await boardPage.stateFilterButton("Closed").click();

    // Assert: the fixture bug appears in the Closed list.
    await expect(boardPage.bugRow(fixture.title)).toBeVisible();

    // Act: reload, check Closed, then switch to Open.
    await boardPage.reload();
    await boardPage.stateFilterButton("Closed").click();
    // Assert: the bug remains under Closed and is absent from Open.
    await expect(boardPage.bugRow(fixture.title)).toBeVisible();
    await boardPage.stateFilterButton("Open").click();
    await expect(boardPage.bugRow(fixture.title)).toHaveCount(0);
  });
});
