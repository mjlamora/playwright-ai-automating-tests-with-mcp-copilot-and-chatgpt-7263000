// spec: specs/testing/edit-bug.md
// seed: tests/seed.spec.ts
import { expect, test } from "@playwright/test";
import {
  bugRow,
  cleanupBugs,
  createBug,
  type BugFixture,
  signIn,
} from "./edit-bug-setup";

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

  test("keeps the ID read-only and allows editing the other fields", async ({
    page,
  }) => {
    // 1. Open the fixture bug's row.
    await bugRow(page, fixture.title).click();

    const dialog = page.getByRole("dialog");
    const id = dialog.getByLabel("ID");
    const title = dialog.getByLabel("Title");
    const severity = dialog.getByLabel("Severity");
    const state = dialog.getByLabel("State");
    const owner = dialog.getByLabel("Owner");
    const description = dialog.getByLabel("Description");
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
    await expect(dialog.getByRole("button", { name: "Save" })).toBeEnabled();
    await dialog.getByRole("button", { name: "Cancel" }).click();
    await expect(dialog).toBeHidden();

    await page.reload();
    await bugRow(page, fixture.title).click();
    await expect(page.getByRole("dialog").getByLabel("ID")).toHaveValue(
      String(fixture.id),
    );
    await expect(page.getByRole("dialog").getByLabel("Title")).toHaveValue(
      fixture.title,
    );
  });
});
