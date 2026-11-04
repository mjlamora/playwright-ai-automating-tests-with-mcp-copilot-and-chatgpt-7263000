// spec: specs/testing/edit-bug.md
// seed: tests/seed.spec.ts
import { expect, test } from "@playwright/test";
import {
  bugRow,
  cleanupBugs,
  createBug,
  type BugFixture,
  recordUpdateRequests,
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

  test("closes with Escape without saving edits", async ({ page }) => {
    // 1. Open the fixture and change its title.
    await bugRow(page, fixture.title).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Title").fill(`${fixture.title}-unsaved`);
    const updateRequests = recordUpdateRequests(page);

    // 2. Press Escape.
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    expect(updateRequests).toHaveLength(0);

    // 3. Reopen to verify the original values.
    await bugRow(page, fixture.title).click();
    const reopenedDialog = page.getByRole("dialog");
    await expect(reopenedDialog.getByLabel("Title")).toHaveValue(fixture.title);
    await expect(reopenedDialog.getByLabel("Severity")).toHaveValue(
      fixture.severity,
    );
    await expect(reopenedDialog.getByLabel("State")).toHaveValue(fixture.state);
    await expect(reopenedDialog.getByLabel("Owner")).toHaveValue(fixture.owner);
    await expect(reopenedDialog.getByLabel("Description")).toHaveValue(
      fixture.description,
    );
  });
});
