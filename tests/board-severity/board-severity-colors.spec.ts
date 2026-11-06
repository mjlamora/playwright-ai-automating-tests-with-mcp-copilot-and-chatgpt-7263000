import { expect, test } from "../fixtures/page-objects";
import {
  cleanupSeverityFixtures,
  createSeverityFixtures,
  signIn,
  type SeverityBugFixture,
} from "./board-severity-setup";
import type { BoardSeverity } from "../pages/BoardPage";

const expectedColors: Record<BoardSeverity, string> = {
  HIGH: "rgb(184, 74, 46)",
  MID: "rgb(166, 124, 71)",
  LOW: "rgb(74, 107, 94)",
};

const expectedTokens: Record<BoardSeverity, string> = {
  HIGH: "#b84a2e",
  MID: "#a67c47",
  LOW: "#4a6b5e",
};

test.describe("Board severity color coding", () => {
  let createdBugIds: number[] = [];
  let severityFixtures: SeverityBugFixture[] = [];

  test.beforeEach(async ({ page, loginPage, boardPage, request }) => {
    // Arrange: sign in, create one bug per severity, and load them on the board.
    createdBugIds = [];
    severityFixtures = [];
    await signIn(loginPage);
    await expect(page).toHaveURL(/\/board$/);
    severityFixtures = await createSeverityFixtures(request, createdBugIds);
    await boardPage.reload();
  });

  test.afterEach(async ({ request }) => {
    await cleanupSeverityFixtures(request, createdBugIds);
  });

  test("displays each severity in its specified color", async ({
    boardPage,
  }) => {
    // Arrange: the HIGH, MID, and LOW fixture bugs are visible on the board.

    // Act: inspect the visible badge for each fixture.
    for (const fixture of severityFixtures) {
      const badge = boardPage.severityBadge(fixture.title, fixture.severity);

      // Assert: the badge label and text color match its severity.
      await expect(badge).toHaveText(fixture.severity);
      await expect(badge).toHaveCSS("color", expectedColors[fixture.severity]);
    }
  });

  test("uses the HIGH severity design token for the HIGH badge", async ({
    boardPage,
  }) => {
    // Arrange: the HIGH fixture bug is visible on the board.
    const highFixture = severityFixtures.find(
      (fixture) => fixture.severity === "HIGH",
    );
    if (!highFixture) {
      throw new Error("The HIGH severity fixture was not created.");
    }

    // Act: inspect the HIGH token, badge rule, and rendered badge.
    const highBadge = boardPage.severityBadge(highFixture.title, "HIGH");
    const highRule = await boardPage.severityBadgeRuleStyles("HIGH");

    // Assert: the HIGH token drives the badge text and background tint.
    expect(await boardPage.severityTokenValue("HIGH")).toBe(expectedTokens.HIGH);
    expect(highRule.color).toBe("var(--color-severity-high)");
    expect(highRule.backgroundColor).toContain(
      "var(--color-severity-high)",
    );
    await expect(highBadge).toHaveCSS("color", expectedColors.HIGH);
  });

  test("keeps severity colors distinct and gives badges clear emphasis", async ({
    boardPage,
  }) => {
    // Arrange: one visible fixture badge exists for each severity.

    // Act: read the computed color, background tint, and label weight.
    const badgeStyles = await Promise.all(
      severityFixtures.map(async (fixture) => {
        const badge = boardPage.severityBadge(fixture.title, fixture.severity);
        const style = await badge.evaluate((element) => {
          const computed = getComputedStyle(element);
          return {
            color: computed.color,
            backgroundColor: computed.backgroundColor,
            fontWeight: computed.fontWeight,
          };
        });
        return { severity: fixture.severity, ...style };
      }),
    );

    // Assert: colors differ, each badge has a 22% tint, and labels are emphasized.
    expect(new Set(badgeStyles.map((style) => style.color)).size).toBe(3);
    for (const style of badgeStyles) {
      expect(style.fontWeight).toBe("600");
      expect(style.backgroundColor).toMatch(/\/\s*0?\.22\)/);
      expect(style.color).toBe(expectedColors[style.severity]);
    }
    expect(
      badgeStyles.find((style) => style.severity === "HIGH")?.color,
    ).toBe(expectedColors.HIGH);
  });

  test("defines severity badge colors through design tokens", async ({
    boardPage,
  }) => {
    // Arrange: the board is loaded with all three severity fixtures.

    // Act: inspect the root tokens and each severity's badge rule.
    for (const severity of ["HIGH", "MID", "LOW"] as const) {
      const tokenName = `--color-severity-${severity.toLowerCase()}`;
      const ruleStyles = await boardPage.severityBadgeRuleStyles(severity);

      // Assert: each severity token is defined and used by its badge rule.
      expect(await boardPage.severityTokenValue(severity)).toBe(
        expectedTokens[severity],
      );
      expect(ruleStyles.color).toBe(`var(${tokenName})`);
      expect(ruleStyles.backgroundColor).toContain(`var(${tokenName})`);
    }
  });
});
