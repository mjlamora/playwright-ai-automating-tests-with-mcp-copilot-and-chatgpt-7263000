import { readFileSync } from "node:fs";
import { type APIRequestContext } from "@playwright/test";
import { expect, test } from "../fixtures/page-objects";
import { type BoardPage, type SortableColumn } from "../pages/BoardPage";

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
  test.beforeEach(async ({ page, loginPage }) => {
    createdBugIds.length = 0;

    // Arrange: authenticate using the same account as the seed spec.
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

  test("shows the default severity-descending sort", async ({ request, boardPage }) => {
    // Arrange: create bugs with distinct severities and reload the board.
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} High`, severity: "HIGH", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Mid`, severity: "MID", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Low`, severity: "LOW", owner: `owner-${marker}`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await boardPage.reload();

    // Act: inspect the board's default order without changing a sort header.

    // Assert: bugs are ordered by descending severity with only that sort active.
    await expectTitlesInOrder(boardPage, [bugs[0].title, bugs[1].title, bugs[2].title]);
    await expectOnlySortColumn(boardPage, "Severity", "descending");
  });

  test("sorts titles ascending on the first Title click", async ({ request, boardPage }) => {
    // Arrange: create title values in non-alphabetical order and reload the board.
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} Zulu`, severity: "HIGH", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Alpha`, severity: "MID", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Mike`, severity: "LOW", owner: `owner-${marker}`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await boardPage.reload();

    // Act: sort by Title.
    await boardPage.sortButton("Title").click();

    // Assert: titles are ascending and Title is the only active sort.
    await expectTitlesInOrder(boardPage, [bugs[1].title, bugs[2].title, bugs[0].title]);
    await expectOnlySortColumn(boardPage, "Title", "ascending");
  });

  test("toggles Title sorting from ascending to descending", async ({ request, boardPage }) => {
    // Arrange: create title values and activate ascending Title order.
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

    // Act: toggle Title sorting to descending.
    await titleHeader.click();

    // Assert: titles are descending and Title remains the active sort.
    await expectTitlesInOrder(boardPage, [bugs[0].title, bugs[2].title, bugs[1].title]);
    await expectOnlySortColumn(boardPage, "Title", "descending");
  });

  test("toggles ID sorting between ascending and descending", async ({ request, boardPage }) => {
    // Arrange: create bugs and reload the board.
    const marker = Date.now().toString();
    const bugs = makeBugs(marker, ["One", "Two", "Three"]);
    const ids = await createBugs(request, bugs);
    await boardPage.reload();
    const idHeader = boardPage.sortButton("ID");

    // Act: click ID to sort ascending.
    await idHeader.click();

    // Assert: IDs are ascending and ID is the only active sort.
    await expectIdsInOrder(boardPage, ids);
    await expectOnlySortColumn(boardPage, "ID", "ascending");

    // Act: click ID again to reverse the order.
    await idHeader.click();

    // Assert: IDs are descending and ID is the only active sort.
    await expectIdsInOrder(boardPage, [...ids].reverse());
    await expectOnlySortColumn(boardPage, "ID", "descending");
  });

  test("toggles Owner sorting between ascending and descending", async ({ request, boardPage }) => {
    // Arrange: create owner values in non-alphabetical order and reload the board.
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} Zulu`, severity: "HIGH", owner: `owner-${marker}-Zed`, description: "Sorting fixture" },
      { title: `Sort ${marker} Alice`, severity: "MID", owner: `owner-${marker}-Alice`, description: "Sorting fixture" },
      { title: `Sort ${marker} Margo`, severity: "LOW", owner: `owner-${marker}-Margo`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await boardPage.reload();
    const ownerHeader = boardPage.sortButton("Owner");

    // Act: click Owner to sort ascending.
    await ownerHeader.click();

    // Assert: owners are ascending and Owner is the only active sort.
    await expectOwnersInOrder(boardPage, bugs.map((bug) => bug.owner).sort());
    await expectOnlySortColumn(boardPage, "Owner", "ascending");

    // Act: click Owner again to reverse the order.
    await ownerHeader.click();

    // Assert: owners are descending and Owner is the only active sort.
    await expectOwnersInOrder(boardPage, bugs.map((bug) => bug.owner).sort().reverse());
    await expectOnlySortColumn(boardPage, "Owner", "descending");
  });

  test("toggles Severity sorting from LOW-MID-HIGH to HIGH-MID-LOW", async ({ request, boardPage }) => {
    // Arrange: create one bug per severity and reload the board.
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} High`, severity: "HIGH", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Mid`, severity: "MID", owner: `owner-${marker}`, description: "Sorting fixture" },
      { title: `Sort ${marker} Low`, severity: "LOW", owner: `owner-${marker}`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await boardPage.reload();
    const severityHeader = boardPage.sortButton("Severity");

    // Act: click Severity to sort ascending.
    await severityHeader.click();

    // Assert: severity is ascending and is the only active sort.
    await expectTitlesInOrder(boardPage, [bugs[2].title, bugs[1].title, bugs[0].title]);
    await expectOnlySortColumn(boardPage, "Severity", "ascending");

    // Act: click Severity again to sort descending.
    await severityHeader.click();

    // Assert: severity is descending and remains the only active sort.
    await expectTitlesInOrder(boardPage, [bugs[0].title, bugs[1].title, bugs[2].title]);
    await expectOnlySortColumn(boardPage, "Severity", "descending");
  });

  test("switches the active sort from Owner to Severity", async ({ request, boardPage }) => {
    // Arrange: create fixtures whose owner and severity orders differ.
    const marker = Date.now().toString();
    const bugs: BugInput[] = [
      { title: `Sort ${marker} High`, severity: "HIGH", owner: `owner-${marker}-Zed`, description: "Sorting fixture" },
      { title: `Sort ${marker} Mid`, severity: "MID", owner: `owner-${marker}-Alice`, description: "Sorting fixture" },
      { title: `Sort ${marker} Low`, severity: "LOW", owner: `owner-${marker}-Margo`, description: "Sorting fixture" },
    ];
    await createBugs(request, bugs);
    await boardPage.reload();

    // Act: activate Owner sorting, then switch to Severity.
    await boardPage.sortButton("Owner").click();
    await boardPage.sortButton("Severity").click();

    // Assert: Severity is active and the titles follow ascending severity.
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
