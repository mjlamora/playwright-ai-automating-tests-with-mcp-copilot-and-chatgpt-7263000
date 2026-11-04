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
    fixture = await createBug(page, fixtures, "high");
  });

  test.afterEach(async ({ page }) => {
    await cleanupBugs(page, fixtures);
  });

  test("opens an existing bug with its current values", async ({ page }) => {
    // 1. Click the row for the newly created bug.
    await bugRow(page, fixture.title).click();

    const dialog = page.getByRole("dialog");
    await expect(dialog).toBeVisible();
    await expect(
      dialog.getByRole("heading", { name: `Edit bug #${fixture.id}` }),
    ).toBeVisible();
    await expect(dialog.getByLabel("ID")).toHaveValue(String(fixture.id));
    await expect(dialog.getByLabel("Title")).toHaveValue(fixture.title);
    await expect(dialog.getByLabel("Severity")).toHaveValue(fixture.severity);
    await expect(dialog.getByLabel("State")).toHaveValue(fixture.state);
    await expect(dialog.getByLabel("Owner")).toHaveValue(fixture.owner);
    await expect(dialog.getByLabel("Description")).toHaveValue(
      fixture.description,
    );
    await expect(dialog.getByRole("button", { name: "Save" })).toBeVisible();
    await expect(dialog.getByRole("button", { name: "Cancel" })).toBeVisible();
  });
});
