import { createWorkspaceFor } from "./support/db";
import { expect, test } from "./support/fixtures";

test("the sidebar becomes a menu on small screens", async ({ page, newUser }) => {
  const owner = await newUser("Mona Mobile");
  const workspace = await createWorkspaceFor(owner.id, { name: "Mobile Co" });

  await page.goto(`/w/${workspace.slug}/dashboard`);
  await expect(page.getByRole("navigation", { name: "Workspace" })).toBeHidden();

  await page.getByRole("button", { name: "Open navigation" }).click();
  const menu = page.getByRole("dialog");
  await menu.getByRole("link", { name: "Settings" }).click();
  await expect(page).toHaveURL(/\/settings\/profile$/);
});
