import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

interface UserAccount {
  username: string;
  password: string;
}

const users = JSON.parse(
  readFileSync(new URL("../../users.json", import.meta.url), "utf8"),
) as UserAccount[];
const [user] = users;

if (!user) {
  throw new Error("users.json must contain at least one user account.");
}

test("opens the create form with the current user's owner value", async ({
  page,
}) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/board$/);
  await page.getByRole("button", { name: "New Bug" }).click();

  const dialog = page.getByRole("dialog", { name: "Create bug" });
  await expect(dialog).toBeVisible();
  const title = dialog.getByLabel("Title");
  const severity = dialog.getByLabel("Severity");
  const owner = dialog.getByLabel("Owner");
  const description = dialog.getByLabel("Description");

  await expect(title).toBeVisible();
  await expect(severity).toBeVisible();
  await expect(owner).toBeVisible();
  await expect(description).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Save" })).toBeVisible();
  await expect(dialog.getByRole("button", { name: "Cancel" })).toBeVisible();

  await expect(owner).toHaveValue(user.username);
  await expect(title).toHaveValue("");
  await expect(description).toHaveValue("");
  await expect(severity.locator("option")).toHaveText(["HIGH", "MID", "LOW"]);
  expect(["high", "mid", "low"]).toContain(await severity.inputValue());
  await expect(title).toBeFocused();
});
