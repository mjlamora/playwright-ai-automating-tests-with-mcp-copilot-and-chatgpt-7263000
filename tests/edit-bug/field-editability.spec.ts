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

  test("keeps the ID read-only and allows editing the other fields", async ({
    boardPage, editBugDialog,
  }) => {
    // 1. Open the fixture bug's row.
    await boardPage.openEditBug(fixture.title);
    const { idInput: id, titleInput: title, severitySelect: severity } = editBugDialog;
    const { stateSelect: state, ownerInput: owner, descriptionInput: description } = editBugDialog;
    await expect(id).toHaveValue(String(fixture.id));
    await expect(id).toHaveJSProperty("readOnly", true);
    await expect(title).toBeEditable();
    await expect(severity).toBeEditable();
    await expect(state).toBeEditable();
    await expect(owner).toBeEditable();
    await expect(description).toBeEditable();

    // 2. Change each editable field, then cancel.
    await title.fill("Edited title that will be cancelled");
    await severity.selectOption("high");
    await state.selectOption("closed");
    await owner.fill("edited-owner");
    await description.fill("Edited description that will be cancelled");
    await expect(id).toHaveValue(String(fixture.id));
    await expect(editBugDialog.saveButton).toBeEnabled();
    await editBugDialog.cancelButton.click();
    await expect(editBugDialog.dialog).toBeHidden();

    await boardPage.reload();
    await boardPage.openEditBug(fixture.title);
    const reopenedDialog = editBugDialog;
    await expect(reopenedDialog.idInput).toHaveValue(String(fixture.id));
    await expect(reopenedDialog.titleInput).toHaveValue(fixture.title);
  });
});
