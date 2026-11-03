import { test, expect } from '../fixtures/pages';

test.describe('Create Bug - Open create-bug modal from board', () => {
  test('should open the create-bug modal from the board page', async ({ loginPage, boardPage, createBugModal }) => {
    // Act
    await loginPage.loginWithFirstUser();

    // Assert
    await expect(boardPage.page).toHaveURL(/\/board$/);
    await expect(boardPage.newBugButton).toBeVisible();

    // Act
    await boardPage.clickNewBugButton();

    // Assert
    await expect(createBugModal.dialog).toBeVisible();
    await expect(createBugModal.titleInput).toBeVisible();
    await expect(createBugModal.severitySelect).toBeVisible();
    await expect(createBugModal.ownerInput).toBeVisible();
    await expect(createBugModal.descriptionInput).toBeVisible();
    await expect(createBugModal.saveButton).toBeVisible();
    await expect(createBugModal.cancelButton).toBeVisible();
  });
});
