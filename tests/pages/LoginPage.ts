import { readFileSync } from "node:fs";
import { join } from "node:path";
import { type Locator, type Page } from "@playwright/test";

interface User {
  username: string;
  password: string;
}

export class LoginPage {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly loginButton: Locator;

  constructor(readonly page: Page) {
    this.usernameInput = page.getByLabel("Username");
    this.passwordInput = page.getByLabel("Password");
    this.loginButton = page.getByRole("button", { name: "Login" });
  }

  async goto(): Promise<void> {
    await this.page.goto("/login");
  }

  async signIn(username: string, password: string): Promise<void> {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.loginButton.click();
  }

  async login(username: string, password: string): Promise<void> {
    await this.signIn(username, password);
    await this.page.waitForURL("**/board");
  }

  async loginWithFirstUser(): Promise<void> {
    const usersPath = join(process.cwd(), "users.json");
    const users = JSON.parse(readFileSync(usersPath, "utf8")) as User[];
    const firstUser = users[0];

    if (!firstUser) {
      throw new Error(`No users found in ${usersPath}.`);
    }

    await this.goto();
    await this.login(firstUser.username, firstUser.password);
  }
}
