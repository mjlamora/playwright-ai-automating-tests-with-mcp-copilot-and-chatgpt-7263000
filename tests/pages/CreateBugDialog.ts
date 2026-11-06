import { type Locator, type Page } from "@playwright/test";

export class CreateBugDialog {
  readonly dialog: Locator;
  readonly titleInput: Locator;
  readonly severitySelect: Locator;
  readonly severityOptions: Locator;
  readonly ownerInput: Locator;
  readonly descriptionInput: Locator;
  readonly saveButton: Locator;
  readonly cancelButton: Locator;

  constructor(readonly page: Page) {
    this.dialog = page.getByRole("dialog", { name: "Create bug" });
    this.titleInput = this.dialog.getByLabel("Title");
    this.severitySelect = this.dialog.getByLabel("Severity");
    this.severityOptions = this.severitySelect.locator("option");
    this.ownerInput = this.dialog.getByLabel("Owner");
    this.descriptionInput = this.dialog.getByLabel("Description");
    this.saveButton = this.dialog.getByRole("button", { name: "Save" });
    this.cancelButton = this.dialog.getByRole("button", { name: "Cancel" });
  }
}
