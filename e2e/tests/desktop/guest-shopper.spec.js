/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const { test, expect } = require("@playwright/test");
const config = require("../../config");
const { getCreditCardExpiry } = require("../../scripts/utils.js");

test("Guest shopper can checkout items as guest", async ({ page }) => {
  await page.goto(config.RETAIL_APP_HOME);

  await page.getByRole("link", { name: "Womens" }).hover();

  await page.getByRole("link", { name: "Tops" }).click();

  await expect(page.getByRole("heading", { name: "Tops" })).toBeVisible();

  await page.getByRole("link", { name: /Stripe Shell/i }).click();

  await expect(
    page.getByRole("heading", { name: /Stripe Shell/i })
  ).toBeVisible();

  await page.getByRole("radio", { name: "L", exact: true }).click();

  await page.getByRole("button", { name: "+" }).click();

  // Selected Size and Color texts are broken into multiple elements on the page.
  // So we need to look at the page URL to verify selected variants
  const updatedPageURL = await page.url();
  const params = updatedPageURL.split("?")[1];
  expect(params).toMatch(/size=9LG/i);
  expect(params).toMatch(/color=JJ5YPA7/i);

  await page.getByRole("button", { name: /Add to Cart/i }).click();

  const addedToCartModal = page.getByText(/2 items added to cart/i);

  await addedToCartModal.waitFor();

  await page.getByLabel("Close").click();

  await page.getByLabel(/My cart/i).click();

  await expect(
    page.getByRole("link", { name: /Stripe Shell/i })
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

  await expect(
    page.getByRole("heading", { name: /Shipping Address/i })
  ).toBeVisible();

  await page.locator("input#firstName").fill("John");
  await page.locator("input#lastName").fill("Doe");
  await page.locator("input#phone").fill("8572068547");
  await page.locator("input#address1").fill("5 Wall St.");
  await page.locator("input#city").fill("Burlington");
  await page.locator("select#stateCode").selectOption("MA");
  await page.locator("input#postalCode").fill("01803");

  await page
    .getByRole("button", { name: /Continue to Shipping Method/i })
    .click();

  // Confirm the shipping details form toggles to show edit button on clicking "Checkout as guest"
  const step1Card = page.locator("div[data-testid='sf-toggle-card-step-1']");

  await expect(step1Card.getByRole("button", { name: /Edit/i })).toBeVisible();

  await expect(
    page.getByRole("heading", { name: /Shipping & Gift Options/i })
  ).toBeVisible();

  await page.getByRole("button", { name: /Continue to Payment/i }).click();

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
  await expect(page.getByRole("link", { name: /Stripe Shell/i })).toBeVisible();
});
