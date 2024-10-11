/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const { test, expect } = require("@playwright/test");
const {
  generateUserCredentials,
} = require("../../scripts/utils.js");
const { addProductToCart, searchProduct, checkoutProduct } = require("../../scripts/pageHelpers.js")

const GUEST_USER_CREDENTIALS = generateUserCredentials();

test("Guest shopper can checkout items as guest", async ({ page }) => {
  await addProductToCart({page})

  // cart
  await page.getByLabel(/My cart/i).click();

  await expect(
    page.getByRole("link", { name: /Cotton Turtleneck Sweater/i })
  ).toBeVisible();

  await checkoutProduct({page, userCredentials: GUEST_USER_CREDENTIALS });

  await expect(
    page.getByRole("heading", { name: /Order Summary/i })
  ).toBeVisible();
  await expect(page.getByText(/2 Items/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Cotton Turtleneck Sweater/i })
  ).toBeVisible();
});

test("Guest shopper can edit product item in cart", async ({ page }) => {
  await addProductToCart({page});

  // cart
  await page.getByLabel(/My cart/i).click();
  await page.waitForLoadState();

  await expect(
    page.getByRole("link", { name: /Cotton Turtleneck Sweater/i })
  ).toBeVisible();

  await expect(page.getByText(/Color: Black/i)).toBeVisible();
  await expect(page.getByText(/Size: L/i)).toBeVisible();

  // open product edit modal
  const editBtn = page.getByRole("button", { name: /Edit/i });
  await editBtn.waitFor();

  expect(editBtn).toBeAttached();

  await editBtn.click();
  await page.waitForLoadState();

  // Product edit modal should be open
  await expect(page.getByTestId('product-view')).toBeVisible();
  
  await page.getByRole("radio", { name: "S", exact: true }).click();
  await page.getByRole("radio", { name: "Meadow Violet", exact: true }).click();
  await page.getByRole("button", { name: /Update/i }).click();

  await page.waitForLoadState();
  await expect(page.getByText(/Color: Meadow Violet/i)).toBeVisible();
  await expect(page.getByText(/Size: S/i)).toBeVisible();
});

test("Guest shopper can checkout product bundle", async ({ page }) => {
  await searchProduct({page, query: 'bundle'});

  await page.getByRole("link", {
    name: /Turquoise Jewelry Bundle/i,
  }).click();

  await page.waitForLoadState();

  await expect(
    page.getByRole("heading", { name: /Turquoise Jewelry Bundle/i })
  ).toBeVisible();

  await page.getByRole("button", { name: /Add Bundle to Cart/i }).click();

  const addedToCartModal = page.getByText(/1 item added to cart/i);
  await addedToCartModal.waitFor();
  await page.getByLabel("Close").click();

  await page.getByLabel(/My cart/i).click();
  await page.waitForLoadState();

  await expect(
    page.getByRole("heading", { name: /Turquoise Jewelry Bundle/i })
  ).toBeVisible();

  // bundle child selections with all color gold
  await expect(page.getByText(/Turquoise and Gold Bracelet/i)).toBeVisible();
  await expect(page.getByText(/Turquoise and Gold Necklace/i)).toBeVisible();
  await expect(page.getByText(/Turquoise and Gold Hoop Earring/i)).toBeVisible();

  const qtyText = page.locator('text="Qty: 1"');
  const colorGoldText = page.locator('text="Color: Gold"');
  await expect(colorGoldText).toHaveCount(3);
  await expect(qtyText).toHaveCount(3);

  await checkoutProduct({page, userCredentials: GUEST_USER_CREDENTIALS });

  await expect(
    page.getByRole("heading", { name: /Order Summary/i })
  ).toBeVisible();
  await expect(page.getByText(/1 Item/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Turquoise Jewelry Bundle/i })
  ).toBeVisible();
  await expect(page.getByText(/Turquoise and Gold Bracelet/i)).toBeVisible();
  await expect(page.getByText(/Turquoise and Gold Necklace/i)).toBeVisible();
  await expect(page.getByText(/Turquoise and Gold Hoop Earring/i)).toBeVisible();
});
