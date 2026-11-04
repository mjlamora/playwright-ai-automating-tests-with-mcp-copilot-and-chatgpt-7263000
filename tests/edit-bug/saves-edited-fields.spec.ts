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

  test("saves edited fields and preserves them after reload", async ({
    page,
  }) => {
    // 1. Open the fixture and change its editable fields.
    await bugRow(page, fixture.title).click();
    const dialog = page.getByRole("dialog");
    const updated = {
      title: `${fixture.title}-updated`,
      severity: "low",
      owner: "updated-owner",
      description: "Updated description persisted by the edit form",
    };
    await dialog.getByLabel("Title").fill(updated.title);
    await dialog.getByLabel("Severity").selectOption(updated.severity);
    await dialog.getByLabel("Owner").fill(updated.owner);
    await dialog.getByLabel("Description").fill(updated.description);

    // 2. Save the edits.
    const updateResponsePromise = page.waitForResponse(
      (response) =>
        response.request().method() === "PUT" &&
        new URL(response.url()).pathname === `/api/bugs/${fixture.id}`,
    );
    await dialog.getByRole("button", { name: "Save" }).click();
    const updateResponse = await updateResponsePromise;
    expect(updateResponse.status()).toBe(200);
    await expect(dialog).toBeHidden();

    const updatedRow = bugRow(page, updated.title);
    await expect(updatedRow).toBeVisible();
    await expect(updatedRow.getByRole("cell", { name: "LOW" })).toBeVisible();
    await expect(
      updatedRow.getByRole("cell", { name: updated.owner }),
    ).toBeVisible();

    // 3. Reload and verify the saved fields.
    await page.reload();
    await bugRow(page, updated.title).click();
    const reopenedDialog = page.getByRole("dialog");
    await expect(reopenedDialog.getByLabel("ID")).toHaveValue(
      String(fixture.id),
    );
    await expect(reopenedDialog.getByLabel("Title")).toHaveValue(updated.title);
    await expect(reopenedDialog.getByLabel("Severity")).toHaveValue(
      updated.severity,
    );
    await expect(reopenedDialog.getByLabel("Owner")).toHaveValue(updated.owner);
    await expect(reopenedDialog.getByLabel("Description")).toHaveValue(
      updated.description,
    );
  });
});
