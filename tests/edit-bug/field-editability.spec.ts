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

  test("keeps the ID read-only and allows editing the other fields", async ({
    boardPage, editBugDialog,
  }) => {
    // Arrange: the fixture bug is created in beforeEach.

    // Act: open the fixture bug.
    await boardPage.openEditBug(fixture.title);
    const { idInput: id, titleInput: title, severitySelect: severity } = editBugDialog;
    const { stateSelect: state, ownerInput: owner, descriptionInput: description } = editBugDialog;

    // Assert: the ID is read-only and all other fields are editable.
    await expect(id).toHaveValue(String(fixture.id));
    await expect(id).toHaveJSProperty("readOnly", true);
    await expect(title).toBeEditable();
    await expect(severity).toBeEditable();
    await expect(state).toBeEditable();
    await expect(owner).toBeEditable();
    await expect(description).toBeEditable();

    // Act: change each editable field and cancel.
    await title.fill("Edited title that will be cancelled");
    await severity.selectOption("high");
    await state.selectOption("closed");
    await owner.fill("edited-owner");
    await description.fill("Edited description that will be cancelled");

    // Assert: the ID remains unchanged and saving is enabled for valid edits.
    await expect(id).toHaveValue(String(fixture.id));
    await expect(editBugDialog.saveButton).toBeEnabled();
    await editBugDialog.cancelButton.click();
    await expect(editBugDialog.dialog).toBeHidden();

    // Act: reload and reopen the bug.
    await boardPage.reload();
    await boardPage.openEditBug(fixture.title);
    const reopenedDialog = editBugDialog;

    // Assert: the original ID and title remain unchanged.
    await expect(reopenedDialog.idInput).toHaveValue(String(fixture.id));
    await expect(reopenedDialog.titleInput).toHaveValue(fixture.title);
  });
});
