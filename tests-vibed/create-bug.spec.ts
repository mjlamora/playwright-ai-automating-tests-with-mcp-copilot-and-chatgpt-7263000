import { readFileSync } from "node:fs";
import { test, expect } from "@playwright/test";

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

test("logs in and creates a bug", async ({ page }) => {
  const title = `Playwright-created bug ${new Date().toLocaleString("en-US", { timeZone: "America/Chicago" })}`;
  const description = "Created by the BuggyBoard Playwright test.";

  await page.goto("/login");
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/board$/);
  await page.getByRole("button", { name: "New Bug" }).click();

  const dialog = page.getByRole("dialog", { name: "Create bug" });
  await expect(dialog).toBeVisible();
  await dialog.getByLabel("Title").fill(title);
  await dialog.getByLabel("Severity").selectOption("high");
  await dialog.getByLabel("Owner").fill(user.username);
  await dialog.getByLabel("Description").fill(description);

  const createBugResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/bugs") &&
      response.request().method() === "POST",
  );
  await dialog.getByRole("button", { name: "Save" }).click();

  const response = await createBugResponse;
  expect(response.status()).toBe(201);
  await expect(dialog).toBeHidden();
  await expect(page.getByRole("cell", { name: title })).toBeVisible();
});
