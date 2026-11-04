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

  test("disables Save when the title is blank", async ({ page }) => {
    // 1. Open the fixture and clear Title.
    await bugRow(page, fixture.title).click();
    const dialog = page.getByRole("dialog");
    const updateRequests = recordUpdateRequests(page);
    await dialog.getByLabel("Title").fill("");
    await expect(
      dialog.getByRole("button", { name: "Save" }),
    ).toBeDisabled();
    await expect(dialog.getByLabel("Title")).toHaveValue("");
    expect(updateRequests).toHaveLength(0);

    await page.reload();
    await bugRow(page, fixture.title).click();
    await expect(page.getByRole("dialog").getByLabel("Title")).toHaveValue(
      fixture.title,
    );
  });
});
