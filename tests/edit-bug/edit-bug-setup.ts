import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, type Page, type Request } from "@playwright/test";
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

export type Severity = "high" | "mid" | "low";

export interface BugFixture {
  id: number;
  title: string;
  severity: Severity;
  owner: string;
  description: string;
  state: "open";
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
  fixtures: BugFixture[],
  severity: Severity = "mid",
): Promise<BugFixture> {
  const title = `edit-test-${randomUUID()}`;
  const description = `Fixture description for ${title}`;

  await boardPage.openCreateBugDialog();
  await dialog.titleInput.fill(title);
  await dialog.severitySelect.selectOption(severity);
  await dialog.ownerInput.fill(user.username);
  await dialog.descriptionInput.fill(description);

  const createResponsePromise = boardPage.page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/bugs",
  );
  await dialog.saveButton.click();
  const createResponse = await createResponsePromise;
  expect(createResponse.status()).toBe(201);

  const createdBug = (await createResponse.json()) as CreatedBugResponse;
  const fixture: BugFixture = {
    id: createdBug.id,
    title,
    severity,
    owner: user.username,
    description,
    state: "open",
  };
  fixtures.push(fixture);

  await expect(dialog.dialog).toBeHidden();
  await expect(boardPage.bugRow(title)).toBeVisible();
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

export function recordUpdateRequests(page: Page): Request[] {
  const requests: Request[] = [];
  page.on("request", (request) => {
    if (
      request.method() === "PUT" &&
      new URL(request.url()).pathname.startsWith("/api/bugs/")
    ) {
      requests.push(request);
    }
  });
  return requests;
}
