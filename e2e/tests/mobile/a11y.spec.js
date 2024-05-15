/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const { test, expect } = require("@playwright/test");
const config = require("../../config");
const { violationFingerprints } = require("../../scripts/utils");
const AxeBuilder = require("@axe-core/playwright").default; // 1

// Note: since we have some know a11y issues on our Pwa kit site, we will keep current snapshot of each page
// By doing snapshot, we don't have to manually keep track of which errors are existing and which are newly created
test.describe("HomePage accessibility", () => {
  test("should not have any automatically detectable accessibility issues except the known issues", async ({
    page,
  }) => {
    await page.goto(config.RETAIL_APP_HOME);
    // wait til product tiles are fully load before analyzing
    await expect(
      page.getByRole("link", { name: /Denim slim skirt/i })
    ).toBeVisible();
    const accessibilityScanResults = await new AxeBuilder({
      page,
    }).analyze();

    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();
  });
});

test.describe("PLP accessibility", () => {
  test("should not have any automatically detectable accessibility issues", async ({
    page,
  }) => {
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

    await page.getByRole("link", { name: "Tops" }).click();

    await expect(page.getByRole("heading", { name: "Tops" })).toBeVisible();

    await expect(
      page.getByRole("link", { name: /Stripe Shell/i })
    ).toBeVisible();
    const accessibilityScanResults = await new AxeBuilder({
      page,
    }).analyze();

    expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();
  });
});
//
// test.describe("Cart page accessibility", () => {
//   test("should not have any automatically detectable accessibility issues", async ({
//     page,
//   }) => {
//     await page.goto(config.RETAIL_APP_HOME);
//
//     await page.getByRole("link", { name: "Womens" }).hover();
//
//     await page.getByRole("link", { name: "Tops" }).click();
//
//     await expect(page.getByRole("heading", { name: "Tops" })).toBeVisible();
//
//     await page.getByRole("link", { name: /Stripe Shell/i }).click();
//
//     await expect(
//       page.getByRole("heading", { name: /Stripe Shell/i })
//     ).toBeVisible();
//
//     await page.getByRole("radio", { name: "L", exact: true }).click();
//
//     await page.locator("button[data-testid='quantity-increment']").click();
//
//     // Selected Size and Color texts are broken into multiple elements on the page.
//     // So we need to look at the page URL to verify selected variants
//     const updatedPageURL = await page.url();
//     const params = updatedPageURL.split("?")[1];
//     expect(params).toMatch(/size=9LG/i);
//     expect(params).toMatch(/color=JJ5YPA7/i);
//
//     await page.getByRole("button", { name: /Add to Cart/i }).click();
//
//     const addedToCartModal = page.getByText(/2 items added to cart/i);
//
//     await addedToCartModal.waitFor();
//
//     await page.getByLabel("Close").click();
//
//     await page.getByLabel(/My cart/i).click();
//
//     await expect(
//       page.getByRole("link", { name: /Stripe Shell/i })
//     ).toBeVisible();
//
//     const accessibilityScanResults = await new AxeBuilder({
//       page,
//     }).analyze();
//
//     expect(violationFingerprints(accessibilityScanResults)).toMatchSnapshot();
//   });
// });
