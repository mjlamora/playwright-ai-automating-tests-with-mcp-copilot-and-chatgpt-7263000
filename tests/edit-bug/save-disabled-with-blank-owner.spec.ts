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

  test("disables Save when the owner is blank", async ({ page }) => {
    // 1. Open the fixture and clear Owner.
    await bugRow(page, fixture.title).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Owner").fill("");
    await expect(
      dialog.getByRole("button", { name: "Save" }),
    ).toBeDisabled();
    await expect(dialog.getByLabel("Owner")).toHaveValue("");

    await page.reload();
    await bugRow(page, fixture.title).click();
    await expect(
      page.getByRole("dialog").getByLabel("Owner"),
    ).toHaveValue(fixture.owner);
  });
});
