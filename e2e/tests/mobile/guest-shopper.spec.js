/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const { test, expect } = require("@playwright/test");
const config = require("../../config");
const { addProductToCartMobile } = require("../../scripts/pageHelpers");
const {
  generateUserCredentials,
  getCreditCardExpiry,
} = require("../../scripts/utils.js");

const GUEST_USER_CREDENTIALS = generateUserCredentials();

test("Guest shopper can checkout items as guest", async ({ page }) => {
  await addProductToCartMobile({page})

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

test("Guest shopper can edit product item in cart", async ({ page }) => {
  await addProductToCartMobile({page})

  // Cart
  await page.getByLabel(/My cart/i).click();

  await expect(
    page.getByRole("link", { name: /Cotton Turtleneck Sweater/i })
  ).toBeVisible();

  await expect(page.getByText(/Color: Black/i)).toBeVisible()
  await expect(page.getByText(/Size: L/i)).toBeVisible()

  await page.getByRole("button", { name: "Edit" }).click();
  await expect(page.getByTestId('product-view')).toBeVisible()      
  
  // update variant in product edit modal
  await page.getByRole("radio", { name: "S", exact: true }).click();
  await page.getByRole("radio", { name: "Meadow Violet", exact: true }).click();
  await page.getByRole("button", { name: /Update/i }).click()

  await expect(page.getByText(/Color: Meadow Violet/i)).toBeVisible()
  await expect(page.getByText(/Size: S/i)).toBeVisible()
});
