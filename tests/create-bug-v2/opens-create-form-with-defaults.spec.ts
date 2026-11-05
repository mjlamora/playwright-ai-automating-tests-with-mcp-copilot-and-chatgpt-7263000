import { readFileSync } from "node:fs";
import { expect, test } from "../fixtures/page-objects";

interface UserAccount {
  username: string;
  password: string;
}

const users = JSON.parse(
  readFileSync(new URL("../../users.json", import.meta.url), "utf8"),
) as UserAccount[];
const [user] = users;

if (!user) {
  throw new Error("users.json must contain at least one user account.");
}

test("opens the create form with the current user's owner value", async ({
  page,
  loginPage,
  boardPage,
  createBugDialog,
}) => {
  // Arrange: navigate to login and authenticate the user.
  await loginPage.goto();
  await loginPage.signIn(user.username, user.password);

  await expect(page).toHaveURL(/\/board$/);

  // Act: open the create bug form.
  await boardPage.openCreateBugDialog();

  // Assert: the form, default values, and available actions are correct.
  await expect(createBugDialog.dialog).toBeVisible();

  await expect(createBugDialog.titleInput).toBeVisible();
  await expect(createBugDialog.severitySelect).toBeVisible();
  await expect(createBugDialog.ownerInput).toBeVisible();
  await expect(createBugDialog.descriptionInput).toBeVisible();
  await expect(createBugDialog.saveButton).toBeVisible();
  await expect(createBugDialog.cancelButton).toBeVisible();

  await expect(createBugDialog.ownerInput).toHaveValue(user.username);
  await expect(createBugDialog.titleInput).toHaveValue("");
  await expect(createBugDialog.descriptionInput).toHaveValue("");
  await expect(createBugDialog.severityOptions).toHaveText([
    "HIGH",
    "MID",
    "LOW",
  ]);
  expect(["high", "mid", "low"]).toContain(
    await createBugDialog.severitySelect.inputValue(),
  );
  await expect(createBugDialog.titleInput).toBeFocused();
});
