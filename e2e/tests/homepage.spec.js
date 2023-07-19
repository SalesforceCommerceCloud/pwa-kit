/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const { test, expect } = require("@playwright/test");
const config = require("../config");

test.describe("Retail app home page loads", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(config.RETAIL_APP_HOME);
  });

  test("has title", async ({ page }) => {
    await expect(page).toHaveTitle(/Home Page/);
  });

  test("get started link", async ({ page }) => {
    await page.getByRole("link", { name: "Get started" }).click();

    const getStartedPage = await page.waitForEvent("popup");
    await getStartedPage.waitForLoadState();

    await expect(getStartedPage).toHaveURL(/.*getting-started/);
  });
});
