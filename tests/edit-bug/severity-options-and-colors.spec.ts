// spec: specs/testing/edit-bug.md
// seed: tests/seed.spec.ts
import { expect, test } from "@playwright/test";
import {
  bugRow,
  cleanupBugs,
  createBug,
  type BugFixture,
  type Severity,
  signIn,
} from "./edit-bug-setup";

test.describe("Edit bug", () => {
  let fixtures: BugFixture[] = [];

  test.beforeEach(async ({ page }) => {
    fixtures = [];
    await signIn(page);
    for (const severity of ["high", "mid", "low"] as const) {
      await createBug(page, fixtures, severity);
    }
  });

  test.afterEach(async ({ page }) => {
    await cleanupBugs(page, fixtures);
  });

  test("offers all severities with matching color coding", async ({ page }) => {
    // 1. Open the HIGH fixture and verify the severity choices.
    const severities: Severity[] = ["high", "mid", "low"];
    for (const severityValue of severities) {
      const fixture = fixtures.find((bug) => bug.severity === severityValue);
      if (!fixture) {
        throw new Error(`Missing ${severityValue} severity fixture.`);
      }

      const row = bugRow(page, fixture.title);
      const boardBadge = row.getByText(severityValue.toUpperCase(), {
        exact: true,
      });
      await row.click();

      const dialog = page.getByRole("dialog");
      const severity = dialog.getByLabel("Severity");
      await expect(severity.locator("option")).toHaveText([
        "HIGH",
        "MID",
        "LOW",
      ]);
      await expect(severity).toHaveValue(severityValue);
      const selectedColor = await severity.evaluate(
        (element) => getComputedStyle(element).color,
      );
      const badgeColor = await boardBadge.evaluate(
        (element) => getComputedStyle(element).color,
      );
      expect(selectedColor).toBe(badgeColor);

      // 2. Cancel without changing the saved bug.
      await dialog.getByRole("button", { name: "Cancel" }).click();
      await expect(dialog).toBeHidden();
    }
  });
});
