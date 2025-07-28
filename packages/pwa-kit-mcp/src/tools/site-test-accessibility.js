/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {chromium} from 'playwright'
import AxeBuilder from '@axe-core/playwright'

export async function runAccessibilityTest(siteUrl) {
    const browser = await chromium.launch()
    const context = await browser.newContext()
    const page = await context.newPage()

    await page.goto(siteUrl)

    const results = await new AxeBuilder({page}).analyze()

    await browser.close()

    return results
}
