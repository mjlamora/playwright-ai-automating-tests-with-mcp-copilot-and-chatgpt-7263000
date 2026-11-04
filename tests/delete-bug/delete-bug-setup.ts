import { readFileSync } from "node:fs";
import { expect, type Page } from "@playwright/test";

interface UserAccount {
  username: string;
  password: string;
}

interface CreatedBugResponse {
  id: number;
}

export interface BugFixture {
  id: number;
  title: string;
}

const users = JSON.parse(
  readFileSync(new URL("../../users.json", import.meta.url), "utf8"),
) as UserAccount[];
const [user] = users;

if (!user) {
  throw new Error("users.json must contain at least one user account.");
}

export async function signIn(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/board$/);
}

export async function createBug(
  page: Page,
  uniqueSuffix: string,
): Promise<BugFixture> {
  const title = `delete-test-${uniqueSuffix}`;
  await page.getByRole("button", { name: "New Bug" }).click();

  const dialog = page.getByRole("dialog", { name: "Create bug" });
  await dialog.getByLabel("Title").fill(title);
  await dialog.getByLabel("Severity").selectOption("high");
  await dialog.getByLabel("Owner").fill(user.username);
  await dialog.getByLabel("Description").fill(`Fixture for ${title}`);

  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/bugs",
  );
  await dialog.getByRole("button", { name: "Save" }).click();
  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBe(201);

  const createdBug = (await createResponse.json()) as CreatedBugResponse;
  const fixture = { id: createdBug.id, title };
  await expect(dialog).toBeHidden();
  await expect(
    page.getByRole("button").filter({ hasText: fixture.title }),
  ).toBeVisible();

  return fixture;
}

export async function cleanupBugs(
  page: Page,
  fixtures: BugFixture[],
): Promise<void> {
  for (const fixture of fixtures) {
    const response = await page.request.delete(
      new URL(`/api/bugs/${fixture.id}`, page.url()).toString(),
    );
    if (response.status() !== 204 && response.status() !== 404) {
      throw new Error(
        `Could not clean up fixture bug ${fixture.id}: HTTP ${response.status()}`,
      );
    }
  }
}
