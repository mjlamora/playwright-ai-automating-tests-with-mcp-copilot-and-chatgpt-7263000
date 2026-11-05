import { type Locator, type Page } from "@playwright/test";

export type SortableColumn = "ID" | "Severity" | "Title" | "Owner";
export type BoardSeverity = "HIGH" | "MID" | "LOW";

export interface SeverityBadgeRuleStyles {
  color: string;
  backgroundColor: string;
}

export class BoardPage {
  readonly newBugButton: Locator;
  readonly searchInput: Locator;
  readonly clearSearchButton: Locator;
  readonly noResultsCell: Locator;
  readonly stateFilter: Locator;
  readonly cells: Locator;

  constructor(readonly page: Page) {
    this.newBugButton = page.getByRole("button", { name: "New Bug" });
    this.searchInput = page.getByRole("search", {
      name: "Search bugs by title",
    });
    this.clearSearchButton = page.getByRole("button", {
      name: "Clear search",
    });
    this.noResultsCell = page.getByRole("cell", {
      name: "No bugs matched.",
      exact: true,
    });
    this.stateFilter = page.getByRole("group", {
      name: "Filter by bug state",
    });
    this.cells = page.getByRole("cell");
  }

  bugRow(title: string): Locator {
    return this.page
      .getByRole("button")
      .filter({ has: this.page.getByText(title, { exact: true }) });
  }

  titleCell(title: string): Locator {
    return this.page.getByRole("cell", { name: title, exact: true });
  }

  severityBadge(title: string, severity: BoardSeverity): Locator {
    return this.bugRow(title).getByText(severity, { exact: true });
  }

  async severityTokenValue(severity: BoardSeverity): Promise<string> {
    const token = `--color-severity-${severity.toLowerCase()}`;
    return this.page.locator("html").evaluate(
      (root, property) => getComputedStyle(root).getPropertyValue(property).trim(),
      token,
    );
  }

  async severityBadgeRuleStyles(
    severity: BoardSeverity,
  ): Promise<SeverityBadgeRuleStyles> {
    const selector = `.severity-badge-${severity.toLowerCase()}`;
    return this.page.evaluate((ruleSelector) => {
      for (const sheet of Array.from(document.styleSheets)) {
        if (
          sheet.href &&
          new URL(sheet.href).origin !== window.location.origin
        ) {
          continue;
        }

        const rule = Array.from(sheet.cssRules).find(
          (cssRule): cssRule is CSSStyleRule =>
            cssRule instanceof CSSStyleRule &&
            cssRule.selectorText === ruleSelector,
        );
        if (rule) {
          return {
            color: rule.style.getPropertyValue("color").trim(),
            backgroundColor: rule.style
              .getPropertyValue("background-color")
              .trim(),
          };
        }
      }

      throw new Error(`Could not find the ${ruleSelector} CSS rule.`);
    }, selector);
  }

  bugSeverityCell(title: string, severity: string): Locator {
    return this.bugRow(title).getByRole("cell", { name: severity, exact: true });
  }

  bugOwnerCell(title: string, owner: string): Locator {
    return this.bugRow(title).getByRole("cell", { name: owner, exact: true });
  }

  stateFilterButton(state: "Open" | "Closed"): Locator {
    return this.stateFilter.getByRole("button", { name: state });
  }

  sortButton(column: SortableColumn): Locator {
    return this.page.getByRole("button", { name: column, exact: true });
  }

  columnHeader(column: SortableColumn): Locator {
    return this.page.getByRole("columnheader", { name: column, exact: true });
  }

  async goto(): Promise<void> {
    await this.page.goto("/board");
  }

  async reload(): Promise<void> {
    await this.page.reload();
  }

  async openCreateBugDialog(): Promise<void> {
    await this.newBugButton.click();
  }

  async openEditBug(title: string): Promise<void> {
    await this.bugRow(title).click();
  }
}
