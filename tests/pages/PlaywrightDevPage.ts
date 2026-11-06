import { type Locator, type Page } from "@playwright/test";

export class PlaywrightDevPage {
  readonly getStartedLink: Locator;
  readonly installationHeading: Locator;

  constructor(readonly page: Page) {
    this.getStartedLink = page.getByRole("link", { name: "Get started" });
    this.installationHeading = page.getByRole("heading", {
      name: "Installation",
    });
  }

  async goto(): Promise<void> {
    await this.page.goto("https://playwright.dev/");
  }

  async openGettingStarted(): Promise<void> {
    await this.getStartedLink.click();
  }
}
