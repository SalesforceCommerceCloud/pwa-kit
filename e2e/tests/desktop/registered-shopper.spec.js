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

const REGISTERED_USER_CREDENTIALS = generateUserCredentials();

test("Registered shopper can checkout items", async ({ page }) => {
  // Create Account and Sign In
  await page.goto(config.RETAIL_APP_HOME + "/registration");

  const registrationFormHeading = page.getByText(/Let's get started!/i);
  await registrationFormHeading.waitFor();

  await page
    .locator("input#firstName")
    .fill(REGISTERED_USER_CREDENTIALS.firstName);
  await page
    .locator("input#lastName")
    .fill(REGISTERED_USER_CREDENTIALS.lastName);
  await page.locator("input#email").fill(REGISTERED_USER_CREDENTIALS.email);
  await page
    .locator("input#password")
    .fill(REGISTERED_USER_CREDENTIALS.password);

  await page.getByRole("button", { name: /Create Account/i }).click();

  await expect(
    page.getByRole("heading", { name: /Account Details/i })
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: /My Account/i })
  ).toBeVisible();

  await expect(page.getByText(/Email/i)).toBeVisible();
  await expect(page.getByText(REGISTERED_USER_CREDENTIALS.email)).toBeVisible();

  // Shop for items as registered user
  await page.goto(config.RETAIL_APP_HOME);

  await page.getByRole("link", { name: "Womens" }).hover();
  const topsNav = await page.getByRole("link", { name: "Tops", exact: true });
  await expect(topsNav).toBeVisible();

  await topsNav.click();

  // PLP
  const productTile = page.getByRole("link", {
    name: /Cotton Turtleneck Sweater/i,
  });
  // selecting swatch
  const productTileImg = productTile.locator("img");
  await productTileImg.waitFor({state: 'visible'})
  const initialSrc = await productTileImg.getAttribute("src");
  await expect(productTile.getByText(/From \$39\.99/i)).toBeVisible();

  await productTile.getByLabel(/Black/, { exact: true }).hover();
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

  // // Selected Size and Color texts are broken into multiple elements on the page.
  // // So we need to look at the page URL to verify selected variants
  const updatedPageURL = await page.url();
  const params = updatedPageURL.split("?")[1];
  expect(params).toMatch(/size=9LG/i);
  expect(params).toMatch(/color=JJ169XX/i);
  await page.getByRole("button", { name: /Add to Cart/i }).click();

  const addedToCartModal = page.getByText(/2 items added to cart/i);

  await addedToCartModal.waitFor();

  await page.getByLabel("Close").click();
  // cart
  await page.getByLabel(/My cart/i).click();

  await expect(
    page.getByRole("link", { name: /Cotton Turtleneck Sweater/i })
  ).toBeVisible();

  await page.getByRole("link", { name: "Proceed to Checkout" }).click();

  // Confirm the email input toggles to show sign out button on clicking "Checkout as guest"
  const step0Card = page.locator("div[data-testid='sf-toggle-card-step-0']");

  await expect(
    step0Card.getByRole("button", { name: /Sign Out/i })
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: /Shipping Address/i })
  ).toBeVisible();

  await page
    .locator("input#firstName")
    .fill(REGISTERED_USER_CREDENTIALS.firstName);
  await page
    .locator("input#lastName")
    .fill(REGISTERED_USER_CREDENTIALS.lastName);
  await page.locator("input#phone").fill(REGISTERED_USER_CREDENTIALS.phone);
  await page
    .locator("input#address1")
    .fill(REGISTERED_USER_CREDENTIALS.address.street);
  await page
    .locator("input#city")
    .fill(REGISTERED_USER_CREDENTIALS.address.city);
  await page
    .locator("select#stateCode")
    .selectOption(REGISTERED_USER_CREDENTIALS.address.state);
  await page
    .locator("input#postalCode")
    .fill(REGISTERED_USER_CREDENTIALS.address.zipcode);

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

  // Confirm the shipping options form toggles to show edit button on clicking "Checkout as guest"
  const step2Card = page.locator("div[data-testid='sf-toggle-card-step-2']");

  await expect(step2Card.getByRole("button", { name: /Edit/i })).toBeVisible();

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
