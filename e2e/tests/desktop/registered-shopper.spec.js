/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const { test, expect } = require("@playwright/test");
const config = require("../../config");
const { addProductToCartDesktop, registerShopper, validateOrderHistory } = require("../../scripts/pageHelpers");
const {
  generateUserCredentials,
  getCreditCardExpiry,
} = require("../../scripts/utils.js");

const REGISTERED_USER_CREDENTIALS = generateUserCredentials();

test("Registered shopper can checkout items", async ({ page }) => {
  // register and login user
  await registerShopper({page, userCredentials: REGISTERED_USER_CREDENTIALS});

  // Shop for items as registered user
  await addProductToCartDesktop({page});

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

  // order history
  await validateOrderHistory({page});
});

// TODO: add test for adding product to wishlist
test("Registered shopper can add item to wishlist", async ({ page }) => {
  // TODO: implement login shopper
  // try {
    // await page.goto(config.RETAIL_APP_HOME + "/login");
  //   // login shopper here, if login fails, register new user
  // } catch(error) {
  //   await registerShopper({page, userCredentials: REGISTERED_USER_CREDENTIALS})
  // }

  await registerShopper({page, userCredentials: REGISTERED_USER_CREDENTIALS})

  // TODO: could pull this out into helper function
  // navigate to PDP
  await page.goto(config.RETAIL_APP_HOME);

  await page.getByRole("link", { name: "Womens" }).hover();
  const topsNav = page.getByRole("link", { name: "Tops", exact: true });
  await expect(topsNav).toBeVisible();
  await topsNav.click();

  const productTile = page.getByRole("link", {
    name: /Cotton Turtleneck Sweater/i,
  });
  await productTile.getByLabel(/Black/, { exact: true }).hover();
  await productTile.click();

  // add product to wishlist
  await expect(
    page.getByRole("heading", { name: /Cotton Turtleneck Sweater/i })
  ).toBeVisible();

  await page.getByRole("radio", { name: "L", exact: true }).click();
  await page.getByRole("button", { name: /Add to Wishlist/i }).click()

  // wishlist
  await page.goto(config.RETAIL_APP_HOME + "/account/wishlist");

  await expect(
    page.getByRole("heading", { name: /Wishlist/i })
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: /Cotton Turtleneck Sweater/i })
  ).toBeVisible();
  await expect(page.getByText(/Color: Black/i)).toBeVisible()
  await expect(page.getByText(/Size: L/i)).toBeVisible()
});
