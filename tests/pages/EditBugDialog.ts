import { type Locator, type Page } from "@playwright/test";

export class EditBugDialog {
  readonly dialog: Locator;
  readonly idInput: Locator;
  readonly titleInput: Locator;
  readonly severitySelect: Locator;
  readonly severityOptions: Locator;
  readonly stateSelect: Locator;
  readonly ownerInput: Locator;
  readonly descriptionInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;
  readonly closeButton: Locator;
  readonly deleteButton: Locator;

  constructor(readonly page: Page) {
    this.dialog = page.getByRole("dialog");
    this.idInput = this.dialog.getByLabel("ID");
    this.titleInput = this.dialog.getByLabel("Title");
    this.severitySelect = this.dialog.getByLabel("Severity");
    this.severityOptions = this.severitySelect.locator("option");
    this.stateSelect = this.dialog.getByLabel("State");
    this.ownerInput = this.dialog.getByLabel("Owner");
    this.descriptionInput = this.dialog.getByLabel("Description");
    this.saveButton = this.dialog.getByRole("button", { name: "Save" });
    this.cancelButton = this.dialog.getByRole("button", { name: "Cancel" });
    this.closeButton = this.dialog.getByRole("button", { name: "Close" });
    this.deleteButton = this.dialog.getByRole("button", {
      name: "Delete",
      exact: true,
    });
  }

  async closeWithEscape(): Promise<void> {
    await this.page.keyboard.press("Escape");
  }

  async clickBackdrop(): Promise<void> {
    await this.dialog.click({ position: { x: 1, y: 1 } });
  }

  heading(bugId: number): Locator {
    return this.dialog.getByRole("heading", {
      name: `Edit bug #${bugId}`,
    });
  }
}
