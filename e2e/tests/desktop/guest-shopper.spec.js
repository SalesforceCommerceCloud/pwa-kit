/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const { test, expect } = require("@playwright/test");
const config = require("../../config");

test("Guest shopper can checkout items as guest", async ({ page }) => {
  await page.goto(config.RETAIL_APP_HOME);

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

  const addedToCartModal = page.getByText(/2 items added to cart/i);

  await addedToCartModal.waitFor();

  await page.getByLabel("Close").click();

  await page.getByLabel(/My cart/i).click();

  await expect(
    page.getByRole("link", { name: /Drape Neck Dress/i })
  ).toBeVisible();

  await page.getByRole("link", { name: "Proceed to Checkout" }).click();

  await expect(
    page.getByRole("heading", { name: /Contact Info/i })
  ).toBeVisible();

  await page.locator("input#email").fill("test@gmail.com");

  await page.getByRole("button", { name: /Checkout as guest/i }).click();

  // Confirm the email input toggles to show edit button on clicking "Checkout as guest" 
  const step0Card = page.locator("div[data-testid='sf-toggle-card-step-0']");

  await expect(step0Card.getByRole("button", { name: /Edit/i })).toBeVisible();
});
