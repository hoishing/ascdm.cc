import { expect, test } from "@playwright/test";

test.describe("ASCDM landing page", () => {
  test("renders the core landing content and email CTAs", async ({ page, isMobile }) => {
    await page.goto("/");

    await expect(page).toHaveTitle(/上升數位行銷顧問/);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("讓搜尋需求變成可持續成長的內容營運系統");
    await expect(page.getByText("上升數位行銷顧問").first()).toBeVisible();
    if (!isMobile) {
      await expect(page.getByText("Ascendant Digital Marketing Consultancy")).toBeVisible();
    }
    await expect(page.getByRole("heading", { name: "把搜尋策略、內容製作與成效回報做成同一套節奏" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "不是一次性交付，而是每週都能前進的工作流" })).toBeVisible();
    await expect(page.getByRole("heading", { name: /每份報告都要回答/ })).toBeVisible();

    const emailLinks = page.locator('a[href="mailto:sales@ascdm.cc"]');
    await expect(emailLinks).toHaveCount(3);
    await expect(page.getByRole("link", { name: "聯絡 sales@ascdm.cc" }).first()).toBeVisible();
  });

  test("loads the planned visual assets", async ({ page }) => {
    await page.goto("/");

    const images = [
      "/assets/ascdm-hero.png",
      "/assets/ascdm-process.png",
      "/assets/ascdm-reporting.png",
    ];

    for (const src of images) {
      const image = page.locator(`img[src="${src}"]`);
      await expect(image).toBeVisible();
      await expect(image).toHaveJSProperty("complete", true);
      const naturalWidth = await image.evaluate((node) => (node as HTMLImageElement).naturalWidth);
      expect(naturalWidth).toBeGreaterThan(0);
    }
  });

  test("keeps major sections usable on mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "mobile viewport check");

    await page.goto("/");

    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expect(page.getByRole("link", { name: "聯絡 sales@ascdm.cc" }).first()).toBeVisible();
    await expect(page.getByRole("heading", { name: "你的內容不是不夠多，而是缺少可追蹤的營運系統" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "把搜尋策略、內容製作與成效回報做成同一套節奏" })).toBeVisible();
  });
});
