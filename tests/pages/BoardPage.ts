import { type Locator, type Page } from "@playwright/test";
import { CreateBugDialog } from "./CreateBugDialog";
import { EditBugDialog } from "./EditBugDialog";

export type SortableColumn = "ID" | "Severity" | "Title" | "Owner";

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

  severityBadge(title: string, severity: string): Locator {
    return this.bugRow(title).getByText(severity, { exact: true });
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

  async openCreateBugDialog(): Promise<CreateBugDialog> {
    await this.newBugButton.click();
    return new CreateBugDialog(this.page);
  }

  async openEditBug(title: string): Promise<EditBugDialog> {
    await this.bugRow(title).click();
    return new EditBugDialog(this.page);
  }
}
