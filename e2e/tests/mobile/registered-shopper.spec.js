/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const { test, expect } = require("@playwright/test");
const config = require("../../config");
const {
  registerShopper,
  addProductToCart,
  validateOrderHistory,
  validateWishlist,
  loginShopper,
  navigateToPDPMobile
} = require("../../scripts/pageHelpers");
const {
  generateUserCredentials,
  getCreditCardExpiry,
} = require("../../scripts/utils.js");

const REGISTERED_USER_CREDENTIALS = generateUserCredentials();

/**
 * Test that registered shoppers can add a product to cart and go through the entire checkout process,
 * validating that shopper is able to get to the order summary section,
 * and that order shows up in order history
 */
test("Registered shopper can checkout items", async ({ page }) => {
  // Create Account and Sign In
  await registerShopper({
    page,
    userCredentials: REGISTERED_USER_CREDENTIALS,
    isMobile: true
  })

  // Shop for items as registered user
  await addProductToCart({page, isMobile: true})

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

  await page.waitForLoadState();
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

  // order history
  await validateOrderHistory({page});
});

/**
 * Test that registered shoppers can navigate to PDP and add a product to wishlist
 */
test("Registered shopper can add item to wishlist", async ({ page }) => {
  const isLoggedIn = await loginShopper({
    page,
    userCredentials: REGISTERED_USER_CREDENTIALS
  })

  if(!isLoggedIn) {
    await registerShopper({
      page,
      userCredentials: REGISTERED_USER_CREDENTIALS,
      isMobile: true
    })
  }

  // PDP
  await navigateToPDPMobile({page});

  // add product to wishlist
  await expect(
    page.getByRole("heading", { name: /Cotton Turtleneck Sweater/i })
  ).toBeVisible();
  await page.getByRole("radio", { name: "L", exact: true }).click();
  await page.getByRole("button", { name: /Add to Wishlist/i }).click()

  // wishlist
  await validateWishlist({page})
});
