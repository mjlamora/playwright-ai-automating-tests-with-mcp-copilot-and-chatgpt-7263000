import { expect, test as base } from "@playwright/test";
import { BoardPage } from "../pages/BoardPage";
import { CreateBugDialog } from "../pages/CreateBugDialog";
import { EditBugDialog } from "../pages/EditBugDialog";
import { LoginPage } from "../pages/LoginPage";
import { PlaywrightDevPage } from "../pages/PlaywrightDevPage";

type PageObjectFixtures = {
  boardPage: BoardPage;
  createBugDialog: CreateBugDialog;
  editBugDialog: EditBugDialog;
  loginPage: LoginPage;
  playwrightDevPage: PlaywrightDevPage;
};

export const test = base.extend<PageObjectFixtures>({
  boardPage: async ({ page }, use) => {
    await use(new BoardPage(page));
  },
  createBugDialog: async ({ page }, use) => {
    await use(new CreateBugDialog(page));
  },
  editBugDialog: async ({ page }, use) => {
    await use(new EditBugDialog(page));
  },
  loginPage: async ({ page }, use) => {
    await use(new LoginPage(page));
  },
  playwrightDevPage: async ({ page }, use) => {
    await use(new PlaywrightDevPage(page));
  },
});

export { expect };
