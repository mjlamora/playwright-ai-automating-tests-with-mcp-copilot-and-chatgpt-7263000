import { readFileSync } from "node:fs";
import { expect, test, type APIRequestContext, type Page } from "@playwright/test";

interface UserAccount {
  username: string;
  password: string;
}

interface BugInput {
  title: string;
  severity: "HIGH" | "MID" | "LOW";
  owner: string;
  description: string;
}

const users = JSON.parse(
  readFileSync(new URL("../../users.json", import.meta.url), "utf8"),
) as UserAccount[];
const [user] = users;

if (!user) {
  throw new Error("users.json must contain at least one user account.");
}

const createdBugIds: number[] = [];
const sortableColumns = ["ID", "Severity", "Title", "Owner"] as const;

test.describe("Board sorting", () => {
  test.beforeEach(async ({ page }) => {
    createdBugIds.length = 0;

    // Arrange: authenticate using the same account as the seed spec.
    await page.goto("/login");
    await page.getByLabel("Username").fill(user.username);
    await page.getByLabel("Password").fill(user.password);
    await page.getByRole("button", { name: "Login" }).click();
    await expect(page).toHaveURL(/\/board$/);
  });

  test.afterEach(async ({ request }) => {
    for (const id of createdBugIds) {
      const response = await request.delete(`/api/bugs/${id}`);
      expect(response.status()).toBe(204);
    }
    createdBugIds.length = 0;
  });

  test("shows the default severity-descending sort", async ({ page, request }) => {
    // Arrange
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} High`, severity: "HIGH", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Mid`, severity: "MID", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Low`, severity: "LOW", owner: `owner-${marker}`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await page.reload();

    // Act: observe the default board order without changing a sort header.

    // Assert
    await expectTitlesInOrder(page, [bugs[0].title, bugs[1].title, bugs[2].title]);
    await expectOnlySortColumn(page, "Severity", "descending");
  });

  test("sorts titles ascending on the first Title click", async ({ page, request }) => {
    // Arrange
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} Zulu`, severity: "HIGH", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Alpha`, severity: "MID", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Mike`, severity: "LOW", owner: `owner-${marker}`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await page.reload();

    // Act
    await page.getByRole("button", { name: "Title", exact: true }).click();

    // Assert
    await expectTitlesInOrder(page, [bugs[1].title, bugs[2].title, bugs[0].title]);
    await expectOnlySortColumn(page, "Title", "ascending");
  });

  test("toggles Title sorting from ascending to descending", async ({ page, request }) => {
    // Arrange
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} Zulu`, severity: "HIGH", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Alpha`, severity: "MID", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Mike`, severity: "LOW", owner: `owner-${marker}`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await page.reload();
    const titleHeader = page.getByRole("button", { name: "Title", exact: true });
    await titleHeader.click();

    // Act
    await titleHeader.click();

    // Assert
    await expectTitlesInOrder(page, [bugs[0].title, bugs[2].title, bugs[1].title]);
    await expectOnlySortColumn(page, "Title", "descending");
  });

  test("toggles ID sorting between ascending and descending", async ({ page, request }) => {
    // Arrange
    const marker = Date.now().toString();
    const bugs = makeBugs(marker, ["One", "Two", "Three"]);
    const ids = await createBugs(request, bugs);
    await page.reload();
    const idHeader = page.getByRole("button", { name: "ID", exact: true });

    // Act and assert: the first click sorts IDs ascending.
    await idHeader.click();
    await expectIdsInOrder(page, ids);
    await expectOnlySortColumn(page, "ID", "ascending");

    // Act and assert: the second click reverses the order.
    await idHeader.click();
    await expectIdsInOrder(page, [...ids].reverse());
    await expectOnlySortColumn(page, "ID", "descending");
  });

  test("toggles Owner sorting between ascending and descending", async ({ page, request }) => {
    // Arrange
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} Zulu`, severity: "HIGH", owner: `owner-${marker}-Zed`, description: "Sorting fixture" },
      { title: `Sort ${marker} Alice`, severity: "MID", owner: `owner-${marker}-Alice`, description: "Sorting fixture" },
      { title: `Sort ${marker} Margo`, severity: "LOW", owner: `owner-${marker}-Margo`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await page.reload();
    const ownerHeader = page.getByRole("button", { name: "Owner", exact: true });

    // Act and assert: the first click sorts owners ascending.
    await ownerHeader.click();
    await expectOwnersInOrder(page, bugs.map((bug) => bug.owner).sort());
    await expectOnlySortColumn(page, "Owner", "ascending");

    // Act and assert: the second click reverses the order.
    await ownerHeader.click();
    await expectOwnersInOrder(page, bugs.map((bug) => bug.owner).sort().reverse());
    await expectOnlySortColumn(page, "Owner", "descending");
  });

  test("toggles Severity sorting from LOW-MID-HIGH to HIGH-MID-LOW", async ({ page, request }) => {
    // Arrange
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} High`, severity: "HIGH", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Mid`, severity: "MID", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Low`, severity: "LOW", owner: `owner-${marker}`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await page.reload();
    const severityHeader = page.getByRole("button", { name: "Severity", exact: true });

    // Act and assert: the first click sorts severity ascending.
    await severityHeader.click();
    await expectTitlesInOrder(page, [bugs[2].title, bugs[1].title, bugs[0].title]);
    await expectOnlySortColumn(page, "Severity", "ascending");

    // Act and assert: the second click sorts severity descending.
    await severityHeader.click();
    await expectTitlesInOrder(page, [bugs[0].title, bugs[1].title, bugs[2].title]);
    await expectOnlySortColumn(page, "Severity", "descending");
  });

  test("switches the active sort from Owner to Severity", async ({ page, request }) => {
    // Arrange: make alphabetical owner order conflict with severity order.
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} High`, severity: "HIGH", owner: `owner-${marker}-Zed`, description: "Sorting fixture" },
      { title: `Sort ${marker} Mid`, severity: "MID", owner: `owner-${marker}-Alice`, description: "Sorting fixture" },
      { title: `Sort ${marker} Low`, severity: "LOW", owner: `owner-${marker}-Margo`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await page.reload();
    await page.getByRole("button", { name: "Owner", exact: true }).click();

    // Act
    await page.getByRole("button", { name: "Severity", exact: true }).click();

    // Assert
    await expectTitlesInOrder(page, [bugs[2].title, bugs[1].title, bugs[0].title]);
    await expectOnlySortColumn(page, "Severity", "ascending");
  });
});

async function createBugs(request: APIRequestContext, bugs: BugInput[]): Promise<number[]> {
  const ids: number[] = [];
  for (const bug of bugs) {
    const response = await request.post("/api/bugs", { data: bug });
    expect(response.status()).toBe(201);
    const body: { id: number } = await response.json();
    expect(typeof body.id).toBe("number");
    ids.push(body.id);
    createdBugIds.push(body.id);
  }
  return ids;
}

function makeBugs(marker: string, names: string[]): BugInput[] {
  return names.map((name) => ({
    title: `Sort ${marker} ${name}`,
    severity: "MID",
    owner: `owner-${marker}`,
    description: "Sorting fixture",
  }));
}

async function expectTitlesInOrder(page: Page, expected: string[]): Promise<void> {
  await expect
    .poll(async () => {
      const allCells = await page.getByRole("cell").allTextContents();
      return allCells.filter((cell) => expected.includes(cell));
    })
    .toEqual(expected);
}

async function expectIdsInOrder(page: Page, expected: number[]): Promise<void> {
  const expectedCells = expected.map(String);
  await expect
    .poll(async () => {
      const allCells = await page.getByRole("cell").allTextContents();
      return allCells.filter((cell) => expectedCells.includes(cell));
    })
    .toEqual(expectedCells);
}

async function expectOwnersInOrder(page: Page, expected: string[]): Promise<void> {
  await expect
    .poll(async () => {
      const allCells = await page.getByRole("cell").allTextContents();
      return allCells.filter((cell) => expected.includes(cell));
    })
    .toEqual(expected);
}

async function expectOnlySortColumn(
  page: Page,
  sortedColumn: (typeof sortableColumns)[number],
  direction: "ascending" | "descending",
): Promise<void> {
  const arrow = direction === "ascending" ? "↑" : "↓";
  for (const column of sortableColumns) {
    const header = page.getByRole("columnheader", { name: column, exact: true });
    if (column === sortedColumn) {
      await expect(header).toHaveAttribute("aria-sort", direction);
      await expect(header).toContainText(arrow);
    } else {
      await expect(header).not.toHaveAttribute("aria-sort");
      await expect(header).not.toContainText(/[↑↓]/);
    }
  }
}
