// spec: specs/testing/edit-bug.md
// seed: tests/seed.spec.ts
import { expect } from "@playwright/test";
import { test } from "../fixtures/page-objects";
import {
  cleanupBugs,
  createBug,
  type BugFixture,
  type Severity,
  signIn,
} from "./edit-bug-setup";

test.describe("Edit bug", () => {
  let fixtures: BugFixture[] = [];

  test.beforeEach(async ({ loginPage, boardPage, createBugDialog }) => {
    // Arrange: sign in and create a fixture for each severity.
    fixtures = [];
    await signIn(loginPage);
    for (const severity of ["high", "mid", "low"] as const) {
      await createBug(boardPage, createBugDialog, fixtures, severity);
    }
  });

  test.afterEach(async ({ page }) => {
    await cleanupBugs(page, fixtures);
  });

  test("offers all severities with matching color coding", async ({ boardPage, editBugDialog }) => {
    // Arrange: severity fixtures are created in beforeEach.
    const severities: Severity[] = ["high", "mid", "low"];
    for (const severityValue of severities) {
      const fixture = fixtures.find((bug) => bug.severity === severityValue);
      if (!fixture) {
        throw new Error(`Missing ${severityValue} severity fixture.`);
      }

      const boardBadge = boardPage.severityBadge(
        fixture.title,
        severityValue.toUpperCase(),
      );

      // Act: open a bug with this severity.
      await boardPage.openEditBug(fixture.title);

      // Assert: all options are available and the selected value matches the badge color.
      await expect(editBugDialog.severityOptions).toHaveText([
        "HIGH",
        "MID",
        "LOW",
      ]);
      await expect(editBugDialog.severitySelect).toHaveValue(severityValue);
      const selectedColor = await editBugDialog.severitySelect.evaluate(
        (element) => getComputedStyle(element).color,
      );
      const badgeColor = await boardBadge.evaluate(
        (element) => getComputedStyle(element).color,
      );
      expect(selectedColor).toBe(badgeColor);

      // Act: close without saving.
      await editBugDialog.cancelButton.click();

      // Assert: the dialog closes.
      await expect(editBugDialog.dialog).toBeHidden();
    }
  });
});
