/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const { test, expect } = require("@playwright/test");
const config = require("../../config");

test.describe("Guest shopper can checkout items as guest", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.RETAIL_APP_HOME);
  });

  test("Guest shopper can add items to cart", async ({ page }) => {
    await page.getByRole("link", { name: "Womens" }).hover();

    await page.getByRole("link", { name: "Dresses" }).click();

    await expect(page.getByRole("heading", { name: "Dresses" })).toBeVisible();

    await page.getByRole("link", { name: /Drape Neck Dress/i }).click();

    await expect(
      page.getByRole("heading", { name: /Drape Neck Dress/i })
    ).toBeVisible();

    await page.getByRole("radio", { name: "M", exact: true }).click();

    await page.getByRole("button", { name: "+" }).click();

    // Selected Size and Color texts are broken into multiple elements on the page.
    // So we need to look at the page URL to verify selected variants
    const updatedPageURL = await page.url();
    const params = updatedPageURL.split("?")[1];
    expect(params).toMatch(/size=9MD/i);
    expect(params).toMatch(/color=JJ3WDXX/i);

    await page.getByRole("button", { name: /Add to Cart/i }).click();

    const addedToCartModal = page.locator(
      "[role='dialog'] heading:has-text('2 items added to cart')"
    );

    page.on("dialog", async (_) => {
      await expect(addedToCartModal).toBeVisible();
    });
  });
});
