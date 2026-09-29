import { expect, test } from "@playwright/test";

test.describe("public pages", () => {
  test("landing page explains the product and leads to sign up", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1 })).toContainText(
      "One intelligent workspace",
    );
    await expect(page.locator('script[type="application/ld+json"]').first()).toBeAttached();

    await page.getByRole("link", { name: "Start free" }).first().click();
    await expect(page).toHaveURL(/\/register$/);
    await expect(page.getByRole("heading", { name: "Create your account" })).toBeVisible();
  });

  test("sign-in page shows the author credit", async ({ page }) => {
    await page.goto("/login");
    const credit = page.getByRole("complementary", { name: "About the author" });
    await expect(credit).toContainText("Ehan Siddique");
    await expect(credit.getByRole("link", { name: /Source on GitHub/ })).toHaveAttribute(
      "href",
      /github\.com\/Fehan999/,
    );
  });

  test("private pages send visitors to sign in and remember where they were going", async ({
    page,
  }) => {
    await page.goto("/w/some-workspace/settings/members");
    await expect(page).toHaveURL(/\/login\?next=%2Fw%2Fsome-workspace%2Fsettings%2Fmembers/);
  });

  test("search engines are kept out of private areas", async ({ request }) => {
    const robots = await (await request.get("/robots.txt")).text();
    expect(robots).toContain("Disallow: /w/");
    expect(robots).toContain("Sitemap:");

    const sitemap = await (await request.get("/sitemap.xml")).text();
    expect(sitemap).toContain("/register");
  });

  test("responses carry security headers", async ({ request }) => {
    const response = await request.get("/");
    const headers = response.headers();
    expect(headers["x-frame-options"]).toBe("DENY");
    expect(headers["x-content-type-options"]).toBe("nosniff");
    expect(headers["content-security-policy"]).toContain("frame-ancestors 'none'");
    expect(headers["x-request-id"]).toBeTruthy();
  });

  test("unknown invitation links are handled gracefully", async ({ page }) => {
    await page.goto("/invite/not-a-real-token");
    await expect(
      page.getByRole("heading", { name: "This invitation link isn't valid" }),
    ).toBeVisible();
  });
});
