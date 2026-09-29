import { addMembership, createUserWithSession, createWorkspaceFor } from "./support/db";
import { expect, signIn, test } from "./support/fixtures";

test.describe("inside a workspace", () => {
  test("the command bar navigates and recognises questions", async ({ page, newUser }) => {
    const owner = await newUser("Omar Owner");
    const workspace = await createWorkspaceFor(owner.id, { name: "Command Co" });

    await page.goto(`/w/${workspace.slug}/dashboard`);
    await page.keyboard.press("ControlOrMeta+k");
    const input = page.getByPlaceholder("Search, jump to a page, or ask a question...");
    await expect(input).toBeVisible();

    await input.fill("Which leads need follow-up?");
    await expect(page.getByText("Detected: ask")).toBeVisible();

    await input.fill("members");
    await page.keyboard.press("Enter");
    await expect(page).toHaveURL(new RegExp(`/w/${workspace.slug}/settings/members`));
  });

  test("owners can invite people and get a shareable link", async ({ page, newUser }) => {
    const owner = await newUser("Ola Owner");
    const workspace = await createWorkspaceFor(owner.id, { name: "Invite Co" });

    await page.goto(`/w/${workspace.slug}/settings/members?invite=1`);
    const dialog = page.getByRole("dialog");
    await dialog.getByLabel("Email address 1").fill("newhire@e2e.operiq.test");
    await dialog.getByRole("button", { name: "Send invitations" }).click();

    await expect(dialog.getByRole("button", { name: "Copy invite link" })).toBeVisible();
    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.locator("#main").getByText("newhire@e2e.operiq.test")).toBeVisible();
  });

  test("viewers get a read-only experience", async ({ page, context, baseURL }) => {
    const owner = await createUserWithSession({ name: "Owen Owner" });
    const workspace = await createWorkspaceFor(owner.id, { name: "Viewer Co" });
    const viewer = await createUserWithSession({ name: "Vera Viewer" });
    await addMembership(workspace.id, viewer.id, "VIEWER");
    await signIn(context, baseURL!, viewer.token);

    await page.goto(`/w/${workspace.slug}/settings/members`);
    await expect(page.getByText("Owen Owner")).toBeVisible();
    await expect(page.getByRole("button", { name: "Invite people" })).toHaveCount(0);

    await page.goto(`/w/${workspace.slug}/settings/audit-log`);
    await expect(
      page.getByRole("heading", { name: "You don't have access to this page" }),
    ).toBeVisible();

    await page.goto(`/w/${workspace.slug}/settings/workspace`);
    await expect(page.getByText("Only owners and admins can change them.")).toBeVisible();
  });

  test("members of one workspace cannot open another", async ({ page, newUser }) => {
    const outsider = await newUser("Ivan Outsider");
    await createWorkspaceFor(outsider.id, { name: "Outsider Co" });
    const stranger = await createUserWithSession({ name: "Stella Stranger" });
    const private_ = await createWorkspaceFor(stranger.id, { name: "Private Co" });

    const response = await page.goto(`/w/${private_.slug}/dashboard`);
    expect(response?.status()).toBe(404);
    await expect(page.getByRole("heading", { name: "We couldn't find that page" })).toBeVisible();
  });
});
