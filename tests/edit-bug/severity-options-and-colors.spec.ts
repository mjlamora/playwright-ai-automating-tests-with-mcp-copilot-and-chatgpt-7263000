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
    // 1. Open the HIGH fixture and verify the severity choices.
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
      await boardPage.openEditBug(fixture.title);
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

      // 2. Cancel without changing the saved bug.
      await editBugDialog.cancelButton.click();
      await expect(editBugDialog.dialog).toBeHidden();
    }
  });
});
