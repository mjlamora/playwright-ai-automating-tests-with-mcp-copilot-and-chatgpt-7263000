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

  test("preserves edits when clicking the backdrop", async ({ page }) => {
    // 1. Open the fixture and change its title and description.
    await bugRow(page, fixture.title).click();
    const dialog = page.getByRole("dialog");
    const changedTitle = `${fixture.title}-unsaved`;
    const changedDescription = "Unsaved description change";
    await dialog.getByLabel("Title").fill(changedTitle);
    await dialog.getByLabel("Description").fill(changedDescription);
    const updateRequests = recordUpdateRequests(page);

    // 2. Click the dimmed backdrop outside the modal panel.
    await dialog.click({ position: { x: 1, y: 1 } });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByLabel("Title")).toHaveValue(changedTitle);
    await expect(dialog.getByLabel("Description")).toHaveValue(
      changedDescription,
    );
    expect(updateRequests).toHaveLength(0);
  });
});
