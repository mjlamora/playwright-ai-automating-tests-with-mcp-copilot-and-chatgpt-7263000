import { expect, test } from "../fixtures/page-objects";

const bugData = [
  { title: 'Login page crashes on empty password', severity: 'HIGH', owner: 'buggy', description: 'App crashes when submitting an empty password on login.' },
  { title: 'Login page redirect fails after auth', severity: 'MID', owner: 'buggy', description: 'User is not redirected to board after successful login.' },
  { title: 'Login page error message not shown', severity: 'LOW', owner: 'buggy', description: 'No error message appears for invalid credentials.' },
  { title: 'Login page enter key stops working', severity: 'MID', owner: 'buggy', description: 'Enter key does not submit the login form.' },
  { title: 'Board page fails to load', severity: 'HIGH', owner: 'buggy', description: 'The bug board is empty even when bugs exist in the database.' },
  { title: 'Search field disappears on page resize', severity: 'LOW', owner: 'buggy', description: 'The search input is not visible after resizing the window.' },
  { title: 'Severity dropdown missing on create page', severity: 'MID', owner: 'buggy', description: 'The severity dropdown does not render in the create bug modal.' },
  { title: 'Create page modal does not close on cancel', severity: 'LOW', owner: 'buggy', description: 'The create bug modal stays open after clicking Cancel.' },
  { title: 'Title bar logo missing on page load', severity: 'LOW', owner: 'buggy', description: 'The logo image does not appear in the title bar.' },
  { title: 'Sort resets on page refresh', severity: 'MID', owner: 'buggy', description: 'Sorting order is lost when the page is refreshed.' },
];

test.describe('Search Bug', () => {
  let createdBugIds: number[] = [];

  test.beforeEach(async ({ page, request, loginPage, boardPage }) => {
    // Arrange: sign in, create search fixtures through the API, and reload the board.
    await loginPage.goto();
    await loginPage.signIn("buggy", "1970beetle");
    await expect(page).toHaveURL(/\/board$/);

    createdBugIds = [];
    for (const bug of bugData) {
      const response = await request.post('/api/bugs', { data: bug });
      const body = await response.json();
      createdBugIds.push(body.id);
    }

    await boardPage.reload();
  });

  test.afterEach(async ({ request }) => {
    for (const id of createdBugIds) {
      await request.delete(`/api/bugs/${id}`);
    }
    createdBugIds = [];
  });

  test('shows all bugs matching a broad title search', async ({ boardPage }) => {
    // Arrange: the searchable bugs are created in beforeEach.

    // Act: search for a word shared by all fixture titles.
    await boardPage.searchInput.fill("page");

    // Assert: every fixture title is visible.
    for (const bug of bugData) {
      await expect(boardPage.titleCell(bug.title)).toBeVisible();
    }
  });

  test('shows matching bugs and hides non-matching bugs', async ({ boardPage }) => {
    // Arrange: the searchable bugs are created in beforeEach.

    // Act: search for "login".
    await boardPage.searchInput.fill("login");

    // Assert: matching titles are visible and non-matching titles are hidden.
    for (const bug of bugData) {
      const titleCell = boardPage.titleCell(bug.title);
      if (bug.title.toLowerCase().includes('login')) {
        await expect(titleCell).toBeVisible();
      } else {
        await expect(titleCell).not.toBeVisible();
      }
    }
  });

  test('shows a no-results message when no bug title matches', async ({ boardPage }) => {
    // Arrange: the searchable bugs are created in beforeEach.

    // Act: search for a title fragment that does not match.
    await boardPage.searchInput.fill("xyzzy");

    // Assert: the empty state is shown and fixture titles are hidden.
    await expect(boardPage.noResultsCell).toBeVisible();

    for (const bug of bugData) {
      await expect(boardPage.titleCell(bug.title)).not.toBeVisible();
    }
  });
});
