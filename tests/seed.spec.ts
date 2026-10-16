import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

interface UserAccount {
  username: string;
  password: string;
}

const users = JSON.parse(
  readFileSync(new URL("../users.json", import.meta.url), "utf8"),
) as UserAccount[];
const [user] = users;

if (!user) {
  throw new Error("users.json must contain at least one user account.");
}

test.describe("Seed", () => {
  test("logs in with the first user account",{tag: '@seed'}, async ({ page }) => {
    await page.goto("/login");
    await page.getByLabel("Username").fill(user.username);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Login" }).click();

    await expect(page).toHaveURL(/\/board$/);
    await expect(page.getByRole("button", { name: "New Bug" })).toBeVisible();
  });
});
