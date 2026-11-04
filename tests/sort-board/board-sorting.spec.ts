import { readFileSync } from "node:fs";
import { expect, test, type APIRequestContext } from "@playwright/test";
import { BoardPage, type SortableColumn } from "../pages/BoardPage";
import { LoginPage } from "../pages/LoginPage";

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
const sortableColumns: SortableColumn[] = ["ID", "Severity", "Title", "Owner"];

test.describe("Board sorting", () => {
  test.beforeEach(async ({ page }) => {
    createdBugIds.length = 0;

    // Arrange: authenticate using the same account as the seed spec.
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.signIn(user.username, user.password);
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
    const boardPage = new BoardPage(page);
    // Arrange
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} High`, severity: "HIGH", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Mid`, severity: "MID", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Low`, severity: "LOW", owner: `owner-${marker}`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await boardPage.reload();

    // Act: observe the default board order without changing a sort header.

    // Assert
    await expectTitlesInOrder(boardPage, [bugs[0].title, bugs[1].title, bugs[2].title]);
    await expectOnlySortColumn(boardPage, "Severity", "descending");
  });

  test("sorts titles ascending on the first Title click", async ({ page, request }) => {
    const boardPage = new BoardPage(page);
    // Arrange
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} Zulu`, severity: "HIGH", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Alpha`, severity: "MID", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Mike`, severity: "LOW", owner: `owner-${marker}`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await boardPage.reload();

    // Act
    await boardPage.sortButton("Title").click();

    // Assert
    await expectTitlesInOrder(boardPage, [bugs[1].title, bugs[2].title, bugs[0].title]);
    await expectOnlySortColumn(boardPage, "Title", "ascending");
  });

  test("toggles Title sorting from ascending to descending", async ({ page, request }) => {
    const boardPage = new BoardPage(page);
    // Arrange
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} Zulu`, severity: "HIGH", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Alpha`, severity: "MID", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Mike`, severity: "LOW", owner: `owner-${marker}`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await boardPage.reload();
    const titleHeader = boardPage.sortButton("Title");
    await titleHeader.click();

    // Act
    await titleHeader.click();

    // Assert
    await expectTitlesInOrder(boardPage, [bugs[0].title, bugs[2].title, bugs[1].title]);
    await expectOnlySortColumn(boardPage, "Title", "descending");
  });

  test("toggles ID sorting between ascending and descending", async ({ page, request }) => {
    const boardPage = new BoardPage(page);
    // Arrange
    const marker = Date.now().toString();
    const bugs = makeBugs(marker, ["One", "Two", "Three"]);
    const ids = await createBugs(request, bugs);
    await boardPage.reload();
    const idHeader = boardPage.sortButton("ID");

    // Act and assert: the first click sorts IDs ascending.
    await idHeader.click();
    await expectIdsInOrder(boardPage, ids);
    await expectOnlySortColumn(boardPage, "ID", "ascending");

    // Act and assert: the second click reverses the order.
    await idHeader.click();
    await expectIdsInOrder(boardPage, [...ids].reverse());
    await expectOnlySortColumn(boardPage, "ID", "descending");
  });

  test("toggles Owner sorting between ascending and descending", async ({ page, request }) => {
    const boardPage = new BoardPage(page);
    // Arrange
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} Zulu`, severity: "HIGH", owner: `owner-${marker}-Zed`, description: "Sorting fixture" },
      { title: `Sort ${marker} Alice`, severity: "MID", owner: `owner-${marker}-Alice`, description: "Sorting fixture" },
      { title: `Sort ${marker} Margo`, severity: "LOW", owner: `owner-${marker}-Margo`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await boardPage.reload();
    const ownerHeader = boardPage.sortButton("Owner");

    // Act and assert: the first click sorts owners ascending.
    await ownerHeader.click();
    await expectOwnersInOrder(boardPage, bugs.map((bug) => bug.owner).sort());
    await expectOnlySortColumn(boardPage, "Owner", "ascending");

    // Act and assert: the second click reverses the order.
    await ownerHeader.click();
    await expectOwnersInOrder(boardPage, bugs.map((bug) => bug.owner).sort().reverse());
    await expectOnlySortColumn(boardPage, "Owner", "descending");
  });

  test("toggles Severity sorting from LOW-MID-HIGH to HIGH-MID-LOW", async ({ page, request }) => {
    const boardPage = new BoardPage(page);
    // Arrange
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} High`, severity: "HIGH", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Mid`, severity: "MID", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Low`, severity: "LOW", owner: `owner-${marker}`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await boardPage.reload();
    const severityHeader = boardPage.sortButton("Severity");

    // Act and assert: the first click sorts severity ascending.
    await severityHeader.click();
    await expectTitlesInOrder(boardPage, [bugs[2].title, bugs[1].title, bugs[0].title]);
    await expectOnlySortColumn(boardPage, "Severity", "ascending");

    // Act and assert: the second click sorts severity descending.
    await severityHeader.click();
    await expectTitlesInOrder(boardPage, [bugs[0].title, bugs[1].title, bugs[2].title]);
    await expectOnlySortColumn(boardPage, "Severity", "descending");
  });

  test("switches the active sort from Owner to Severity", async ({ page, request }) => {
    const boardPage = new BoardPage(page);
    // Arrange: make alphabetical owner order conflict with severity order.
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} High`, severity: "HIGH", owner: `owner-${marker}-Zed`, description: "Sorting fixture" },
      { title: `Sort ${marker} Mid`, severity: "MID", owner: `owner-${marker}-Alice`, description: "Sorting fixture" },
      { title: `Sort ${marker} Low`, severity: "LOW", owner: `owner-${marker}-Margo`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await boardPage.reload();
    await boardPage.sortButton("Owner").click();

    // Act
    await boardPage.sortButton("Severity").click();

    // Assert
    await expectTitlesInOrder(boardPage, [bugs[2].title, bugs[1].title, bugs[0].title]);
    await expectOnlySortColumn(boardPage, "Severity", "ascending");
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

async function expectTitlesInOrder(boardPage: BoardPage, expected: string[]): Promise<void> {
  await expect
    .poll(async () => {
      const allCells = await boardPage.cells.allTextContents();
      return allCells.filter((cell) => expected.includes(cell));
    })
    .toEqual(expected);
}

async function expectIdsInOrder(boardPage: BoardPage, expected: number[]): Promise<void> {
  const expectedCells = expected.map(String);
  await expect
    .poll(async () => {
      const allCells = await boardPage.cells.allTextContents();
      return allCells.filter((cell) => expectedCells.includes(cell));
    })
    .toEqual(expectedCells);
}

async function expectOwnersInOrder(boardPage: BoardPage, expected: string[]): Promise<void> {
  await expect
    .poll(async () => {
      const allCells = await boardPage.cells.allTextContents();
      return allCells.filter((cell) => expected.includes(cell));
    })
    .toEqual(expected);
}

async function expectOnlySortColumn(
  boardPage: BoardPage,
  sortedColumn: SortableColumn,
  direction: "ascending" | "descending",
): Promise<void> {
  const arrow = direction === "ascending" ? "↑" : "↓";
  for (const column of sortableColumns) {
    const header = boardPage.columnHeader(column);
    if (column === sortedColumn) {
      await expect(header).toHaveAttribute("aria-sort", direction);
      await expect(header).toContainText(arrow);
    } else {
      await expect(header).not.toHaveAttribute("aria-sort");
      await expect(header).not.toContainText(/[↑↓]/);
    }
  }
}
