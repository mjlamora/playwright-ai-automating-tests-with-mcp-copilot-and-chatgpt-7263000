import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, type Page, type Request } from "@playwright/test";

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

export async function signIn(page: Page): Promise<void> {
  await page.goto("/login");
  await page.getByLabel("Username").fill(user.username);
  await page.getByLabel("Password").fill(user.password);
  await page.getByRole("button", { name: "Login" }).click();

  await expect(page).toHaveURL(/\/board$/);
}

export function bugRow(page: Page, title: string) {
  return page
    .getByRole("button")
    .filter({ has: page.getByText(title, { exact: true }) });
}

export async function createBug(
  page: Page,
  fixtures: BugFixture[],
  severity: Severity = "mid",
): Promise<BugFixture> {
  const title = `edit-test-${randomUUID()}`;
  const description = `Fixture description for ${title}`;

  await page.getByRole("button", { name: "New Bug" }).click();
  const dialog = page.getByRole("dialog", { name: "Create bug" });
  await dialog.getByLabel("Title").fill(title);
  await dialog.getByLabel("Severity").selectOption(severity);
  await dialog.getByLabel("Owner").fill(user.username);
  await dialog.getByLabel("Description").fill(description);

  const createResponsePromise = page.waitForResponse(
    (response) =>
      response.request().method() === "POST" &&
      new URL(response.url()).pathname === "/api/bugs",
  );
  await dialog.getByRole("button", { name: "Save" }).click();
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

  await expect(dialog).toBeHidden();
  await expect(bugRow(page, title)).toBeVisible();
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
