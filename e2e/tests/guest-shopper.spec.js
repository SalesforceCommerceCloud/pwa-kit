/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const { test, expect } = require("@playwright/test");
const config = require("../config");

test.describe("Guest shopper can checkout items as guest", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.RETAIL_APP_HOME);
  });

  test("Guest shopper can add items to cart", async ({ page }) => {
    await page.getByRole("link", { name: "Electronics" }).hover();

    await page.getByRole("link", { name: "Digital Cameras" }).click();

    await expect(
      page.getByRole("heading", { name: "Digital Cameras" })
    ).toBeVisible();
  });
});
