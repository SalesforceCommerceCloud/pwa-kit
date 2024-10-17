/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const { test, expect } = require("@playwright/test");
const config = require("../config");
const {
  generateUserCredentials
} = require("../scripts/utils.js");

const REGISTERED_USER_CREDENTIALS = generateUserCredentials();

const registerUser = async (page) => {
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
}
test.describe("Consent Tracking form works as expected", () => {
  test.beforeEach(async ({ page }) => {
    await page.context().clearCookies();
    await page.goto(config.RETAIL_APP_HOME);
  });

  test("Closing form when defaultDnt exists sets DNT to defaultDnt", async ({ page }) => {
    const modalSelector = '[aria-label="Close consent tracking form"]'
    page.locator(modalSelector).waitFor()
    await expect(page.getByText(/Tracking Consent/i)).toBeVisible({timeout: 10000});
    await page.locator('button[aria-label="Close consent tracking form"]').click();
    
    const cookies = await page.context().cookies();
    const cookieName = 'dw_dnt';
    const cookie = cookies.find(cookie => cookie.name === cookieName);
    expect(cookie).toBeTruthy();
    // The value of 1 comes from defaultDnt prop in _app-config/index.jsx
    expect(cookie.value).toBe('1');
  });

  test("Clicking on Accept makes DNT=0", async ({ page }) => {
    const modalSelector = '[aria-label="Close consent tracking form"]'
    page.locator(modalSelector).waitFor()
    await expect(page.getByText(/Tracking Consent/i)).toBeVisible({timeout: 10000});
    await page.locator('button[aria-label="Accept Tracking"]:visible').click();
    
    const cookies = await page.context().cookies();
    const cookieName = 'dw_dnt';
    const cookie = cookies.find(cookie => cookie.name === cookieName);
    expect(cookie).toBeTruthy();
    expect(cookie.value).toBe('0');
  });

  test("Clicking on Decline makes DNT=1", async ({ page }) => {
    const modalSelector = '[aria-label="Close consent tracking form"]'
    page.locator(modalSelector).waitFor()
    await expect(page.getByText(/Tracking Consent/i)).toBeVisible({timeout: 10000});
    await page.locator('button[aria-label="Decline Tracking"]:visible').click();
    
    const cookies = await page.context().cookies();
    const cookieName = 'dw_dnt';
    const cookie = cookies.find(cookie => cookie.name === cookieName);
    expect(cookie).toBeTruthy();
    expect(cookie.value).toBe('1');
  });

  test("Logging in preserves DNT preference", async ({ page }) => {
    const modalSelector = '[aria-label="Close consent tracking form"]'
    page.locator(modalSelector).waitFor()
    await expect(page.getByText(/Tracking Consent/i)).toBeVisible({timeout: 10000});
    await page.locator('button[aria-label="Decline Tracking"]:visible').click();

    await registerUser(page)

    const cookies = await page.context().cookies();
    const cookieName = 'dw_dnt';
    const cookie = cookies.find(cookie => cookie.name === cookieName);
    expect(cookie).toBeTruthy();
    expect(cookie.value).toBe('1');
  });

  test("Logging out clears DNT preference", async ({ page }) => {
    const modalSelector = '[aria-label="Close consent tracking form"]'
    page.locator(modalSelector).waitFor()
    await expect(page.getByText(/Tracking Consent/i)).toBeVisible({timeout: 10000});
    await page.locator('button[aria-label="Decline Tracking"]:visible').click();
    
    await registerUser(page)

    const buttons = await page.getByText(/Log Out/i).elementHandles();
    for (const button of buttons) {
        if (await button.isVisible()) {
            await button.click();
            break;
        }
    }

    const cookies = await page.context().cookies();
    if (cookies.some(item => item.name === "dw_dnt")) {
        throw new Error('dw_dnt still exists in the cookies');
    }
  });
});
