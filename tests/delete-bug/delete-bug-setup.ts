import { readFileSync } from "node:fs";
import { expect, type Page } from "@playwright/test";
import type { BoardPage } from "../pages/BoardPage";
import type { CreateBugDialog } from "../pages/CreateBugDialog";
import type { LoginPage } from "../pages/LoginPage";

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

export async function signIn(loginPage: LoginPage): Promise<void> {
  await loginPage.goto();
  await loginPage.signIn(user.username, user.password);

  await expect(loginPage.page).toHaveURL(/\/board$/);
}

export async function createBug(
  boardPage: BoardPage,
  dialog: CreateBugDialog,
  uniqueSuffix: string,
): Promise<BugFixture> {
  const title = `delete-test-${uniqueSuffix}`;
  await boardPage.openCreateBugDialog();
  await dialog.titleInput.fill(title);
  await dialog.severitySelect.selectOption("high");
  await dialog.ownerInput.fill(user.username);
  await dialog.descriptionInput.fill(`Fixture for ${title}`);

  const createResponsePromise = boardPage.page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/bugs",
  );
  await dialog.saveButton.click();
  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBe(201);

  const createdBug = (await createResponse.json()) as CreatedBugResponse;
  const fixture = { id: createdBug.id, title };
  await expect(dialog.dialog).toBeHidden();
  await expect(
    boardPage.bugRow(fixture.title),
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
