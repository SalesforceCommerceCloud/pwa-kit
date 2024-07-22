/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const { test, expect } = require("@playwright/test");
const config = require("../../config");
const {
  generateUserCredentials,
  getCreditCardExpiry,
} = require("../../scripts/utils.js");

const GUEST_USER_CREDENTIALS = generateUserCredentials();

test("Guest shopper can checkout items as guest", async ({ page }) => {
  // Home page
  await page.goto(config.RETAIL_APP_HOME);

  await page.getByLabel("Menu", { exact: true }).click();

  // SSR nav loads top level categories as direct links so we wait till all sub-categories load in the accordion
  const categoryAccordion = page.locator(
    "#category-nav .chakra-accordion__button svg+:text('Womens')"
  );
  await categoryAccordion.waitFor();

  await page.getByRole("button", { name: "Womens" }).click();

  const clothingNav = page.getByRole("button", { name: "Clothing" });

  await clothingNav.waitFor();

  await clothingNav.click();

  const topsLink = page.getByLabel('Womens').getByRole("link", { name: "Tops" })
  await topsLink.click();
  // Wait for the nav menu to close first
  await topsLink.waitFor({state: 'hidden'})

  await expect(page.getByRole("heading", { name: "Tops" })).toBeVisible();

  // PLP
  const productTile = page.getByRole("link", {
    name: /Cotton Turtleneck Sweater/i,
  });
  await productTile.scrollIntoViewIfNeeded()
  // selecting swatch
  const productTileImg = productTile.locator("img");
  await productTileImg.waitFor({state: 'visible'})
  const initialSrc = await productTileImg.getAttribute("src");
  await expect(productTile.getByText(/From \$39\.99/i)).toBeVisible();

  await productTile.getByLabel(/Black/, { exact: true }).click();
  // Make sure the image src has changed
  await expect(async () => {
    const newSrc = await productTileImg.getAttribute("src")
    expect(newSrc).not.toBe(initialSrc)
  }).toPass()
  await expect(productTile.getByText(/From \$39\.99/i)).toBeVisible();
  await productTile.click();

  // PDP
  await expect(
    page.getByRole("heading", { name: /Cotton Turtleneck Sweater/i })
  ).toBeVisible();
  await page.getByRole("radio", { name: "L", exact: true }).click();

  await page.locator("button[data-testid='quantity-increment']").click();

  // Selected Size and Color texts are broken into multiple elements on the page.
  // So we need to look at the page URL to verify selected variants
  const updatedPageURL = await page.url();
  const params = updatedPageURL.split("?")[1];
  expect(params).toMatch(/size=9LG/i);
  expect(params).toMatch(/color=JJ169XX/i);

  await page.getByRole("button", { name: /Add to Cart/i }).click();

  const addedToCartModal = page.getByText(/2 items added to cart/i);

  await addedToCartModal.waitFor();

  await page.getByLabel("Close").click();

  // Cart
  await page.getByLabel(/My cart/i).click();

  await expect(
    page.getByRole("link", { name: /Cotton Turtleneck Sweater/i })
  ).toBeVisible();

  await page.getByRole("link", { name: "Proceed to Checkout" }).click();

  // Check out
  await expect(
    page.getByRole("heading", { name: /Contact Info/i })
  ).toBeVisible();

  await page.locator("input#email").fill("test@gmail.com");

  await page.getByRole("button", { name: /Checkout as guest/i }).click();

  // Confirm the email input toggles to show edit button on clicking "Checkout as guest"
  const step0Card = page.locator("div[data-testid='sf-toggle-card-step-0']");

  await expect(step0Card.getByRole("button", { name: /Edit/i })).toBeVisible();

  await expect(
    page.getByRole("heading", { name: /Shipping Address/i })
  ).toBeVisible();

  await page.locator("input#firstName").fill(GUEST_USER_CREDENTIALS.firstName);
  await page.locator("input#lastName").fill(GUEST_USER_CREDENTIALS.lastName);
  await page.locator("input#phone").fill(GUEST_USER_CREDENTIALS.phone);
  await page
    .locator("input#address1")
    .fill(GUEST_USER_CREDENTIALS.address.street);
  await page.locator("input#city").fill(GUEST_USER_CREDENTIALS.address.city);
  await page
    .locator("select#stateCode")
    .selectOption(GUEST_USER_CREDENTIALS.address.state);
  await page
    .locator("input#postalCode")
    .fill(GUEST_USER_CREDENTIALS.address.zipcode);

  await page
    .getByRole("button", { name: /Continue to Shipping Method/i })
    .click();

  // Confirm the shipping details form toggles to show edit button on clicking "Checkout as guest"
  const step1Card = page.locator("div[data-testid='sf-toggle-card-step-1']");

  await expect(step1Card.getByRole("button", { name: /Edit/i })).toBeVisible();

  await expect(
    page.getByRole("heading", { name: /Shipping & Gift Options/i })
  ).toBeVisible();
  await page.waitForTimeout(2000);

  const continueToPayment = page.getByRole("button", {
    name: /Continue to Payment/i,
  });

  if (continueToPayment.isEnabled()) {
    await continueToPayment.click();
  }

  await expect(page.getByRole("heading", { name: /Payment/i })).toBeVisible();

  const creditCardExpiry = getCreditCardExpiry();

  await page.locator("input#number").fill("4111111111111111");
  await page.locator("input#holder").fill("John Doe");
  await page.locator("input#expiry").fill(creditCardExpiry);
  await page.locator("input#securityCode").fill("213");

  await page.getByRole("button", { name: /Review Order/i }).click();

  // Confirm the shipping options form toggles to show edit button on clicking "Checkout as guest"
  const step3Card = page.locator("div[data-testid='sf-toggle-card-step-3']");

  await expect(step3Card.getByRole("button", { name: /Edit/i })).toBeVisible();
  page
    .getByRole("button", { name: /Place Order/i })
    .first()
    .click();

  // Order confirmation
  const orderConfirmationHeading = page.getByRole("heading", {
    name: /Thank you for your order!/i,
  });
  await orderConfirmationHeading.waitFor();

  await expect(
    page.getByRole("heading", { name: /Order Summary/i })
  ).toBeVisible();
  await expect(page.getByText(/2 Items/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /Cotton Turtleneck Sweater/i })
  ).toBeVisible();
});
