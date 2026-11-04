import { readFileSync } from "node:fs";
import { expect, test } from "./fixtures/page-objects";

interface UserAccount {
  username: string;
  password: string;
}

const users = JSON.parse(
  readFileSync(new URL("../users.json", import.meta.url), "utf8"),
) as UserAccount[];
const [user] = users;

if (!user) {
  throw new Error("users.json must contain at least one user account.");
}

test.describe("Seed", () => {
  test("logs in with the first user account", { tag: "@seed" }, async ({
    page,
    loginPage,
    boardPage,
  }) => {
    await loginPage.goto();
    await loginPage.signIn(user.username, user.password);

    await expect(page).toHaveURL(/\/board$/);
    await expect(boardPage.newBugButton).toBeVisible();
  });
});
