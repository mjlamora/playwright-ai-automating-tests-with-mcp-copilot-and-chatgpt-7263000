import { randomUUID } from "node:crypto";
import { readFileSync } from "node:fs";
import { expect, type APIRequestContext } from "@playwright/test";
import type { BoardSeverity } from "../pages/BoardPage";
import type { LoginPage } from "../pages/LoginPage";

interface UserAccount {
  username: string;
  password: string;
}

interface CreatedBugResponse {
  id: number;
}

export interface SeverityBugFixture {
  id: number;
  title: string;
  severity: BoardSeverity;
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
}

export async function createSeverityFixtures(
  request: APIRequestContext,
  createdBugIds: number[],
): Promise<SeverityBugFixture[]> {
  const marker = randomUUID();
  const severities: BoardSeverity[] = ["HIGH", "MID", "LOW"];
  const fixtures: SeverityBugFixture[] = [];

  for (const severity of severities) {
    const title = `board-severity-${marker}-${severity.toLowerCase()}`;
    const response = await request.post("/api/bugs", {
      data: {
        title,
        severity,
        owner: user.username,
        description: `Fixture for ${severity} board severity color test`,
      },
    });
    expect(response.status()).toBe(201);

    const createdBug = (await response.json()) as CreatedBugResponse;
    if (typeof createdBug.id !== "number") {
      throw new Error(`API did not return a numeric ID for ${severity} fixture.`);
    }

    createdBugIds.push(createdBug.id);
    fixtures.push({ id: createdBug.id, title, severity });
  }

  return fixtures;
}

export async function cleanupSeverityFixtures(
  request: APIRequestContext,
  createdBugIds: number[],
): Promise<void> {
  for (const id of createdBugIds) {
    const response = await request.delete(`/api/bugs/${id}`);
    if (response.status() !== 204) {
      throw new Error(
        `Could not clean up board severity fixture ${id}: HTTP ${response.status()}`,
      );
    }
  }
}
