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

  test("disables Save when the description is blank", async ({ page }) => {
    // 1. Open the fixture and clear Description.
    await bugRow(page, fixture.title).click();
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Description").fill("");
    await expect(
      dialog.getByRole("button", { name: "Save" }),
    ).toBeDisabled();
    await expect(dialog.getByLabel("Description")).toHaveValue("");

    await page.reload();
    await bugRow(page, fixture.title).click();
    await expect(
      page.getByRole("dialog").getByLabel("Description"),
    ).toHaveValue(fixture.description);
  });
});
