import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";

interface UserAccount {
  username: string;
  password: string;
}

const users = JSON.parse(
  readFileSync(new URL("../users.json", import.meta.url), "utf8")
) as UserAccount[];
const [user] = users;

if (!user) {
  throw new Error("users.json must contain at least one user account.");
}

test("closes the first open bug and reopens it", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page).toHaveURL(/\/board$/);

  const bugsTable = page.getByRole("table", { name: "Bugs" });
  const bugRows = bugsTable.locator("tbody tr[role='button']");
  const firstBug = bugRows.first();
  await expect(firstBug).toBeVisible();
  const bugId = (await firstBug.locator("td").first().innerText()).trim();
  const title = (await firstBug.locator("td").nth(2).innerText()).trim();
  const rowForBug = () => bugRows.filter({ hasText: title });
  const dialog = page.getByRole("dialog");
  let bugWasClosed = false;

  async function saveState(state: "open" | "closed") {
    await dialog.getByLabel("State").selectOption(state);
    const updateResponse = page.waitForResponse(
      (response) =>
        response.url().endsWith(`/api/bugs/${bugId}`) &&
        response.request().method() === "PUT"
    );
    await dialog.getByRole("button", { name: "Save" }).click();
    return updateResponse;
  }

  try {
    await firstBug.click();
    await expect(dialog).toBeVisible();

    const closeResponse = await saveState("closed");
    bugWasClosed = closeResponse.ok();
    expect(closeResponse.status()).toBe(200);
    await expect(dialog).toBeHidden();

    await page.getByRole("button", { name: "Closed", exact: true }).click();
    await expect(
      bugsTable.getByRole("cell", { name: title, exact: true })
    ).toBeVisible();
  } finally {
    if (bugWasClosed) {
      await page.getByRole("button", { name: "Closed", exact: true }).click();
      await rowForBug().click();
      await expect(dialog).toBeVisible();

      const reopenResponse = await saveState("open");
      expect(reopenResponse.status()).toBe(200);
      await expect(dialog).toBeHidden();

      await page.getByRole("button", { name: "Open", exact: true }).click();
      await expect(
        bugsTable.getByRole("cell", { name: title, exact: true })
      ).toBeVisible();
    }
  }
});
