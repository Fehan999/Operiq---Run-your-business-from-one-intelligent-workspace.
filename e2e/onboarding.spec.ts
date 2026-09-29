import { expect, test } from "./support/fixtures";

test("a new user sets up a workspace and lands on the dashboard", async ({ page, newUser }) => {
  await newUser("Nadia Onboarding");

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/onboarding$/);

  const name = `Nova ${Date.now().toString(36)}`;
  await page.getByLabel("Workspace name").fill(name);
  await expect(page.getByText("Available")).toBeVisible();
  await page.getByRole("button", { name: "Create workspace" }).click();

  await expect(page).toHaveURL(/\/onboarding\/[^/]+\/business$/);
  await page.getByLabel("Industry").click();
  await page.getByRole("option", { name: "Marketing or creative agency" }).click();
  await page.getByRole("radio", { name: "2 to 10" }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/brand$/);
  await page.getByRole("button", { name: "Skip for now" }).click();

  await expect(page).toHaveURL(/\/goals$/);
  await page.getByRole("checkbox", { name: /Win more deals/ }).click();
  await page.getByRole("button", { name: "Continue" }).click();

  await expect(page).toHaveURL(/\/team$/);
  await page.getByLabel("Email address 1").fill("teammate@e2e.operiq.test");
  await page.getByRole("button", { name: "Invite", exact: true }).click();
  await expect(page.getByText("Latest invitations")).toBeVisible();
  await page.getByRole("button", { name: "Go to my dashboard" }).click();

  await expect(page).toHaveURL(/\/w\/[^/]+\/dashboard$/);
  await expect(page.getByRole("heading", { level: 1 })).toContainText("Nadia");
  await expect(page.getByText(`created the workspace ${name}`)).toBeVisible();
  await expect(page.getByText("invited teammate@e2e.operiq.test as Member")).toBeVisible();
});

test("unverified users are asked to verify before anything else", async ({
  page,
  context,
  baseURL,
}) => {
  const { createUserWithSession } = await import("./support/db");
  const { signIn } = await import("./support/fixtures");
  const user = await createUserWithSession({ name: "Uma Unverified", verified: false });
  await signIn(context, baseURL!, user.token);

  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/verify-email$/);
  await expect(page.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
});
