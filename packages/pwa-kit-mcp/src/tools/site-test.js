/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {runPerformanceTest} from './site-test-performance'
import {runAccessibilityTest} from './site-test-accessibility'

const DEFAULT_SITE_URL = 'https://pwa-kit.mobify-storefront.com'

export class TestWithPlaywrightTool {
    /**
     * Runs a Playwright test file by name (e.g., 'performance' or 'accessibility')
     * @param {string} testType - 'performance' or 'accessibility'
     * @param {string} [siteUrl] - Optional site URL to test
     * @returns {object} - Result of the test run
     */
    async run(testType, siteUrl = DEFAULT_SITE_URL) {
        switch (testType) {
            case 'performance': {
                return runPerformanceTest(siteUrl)
            }
            case 'accessibility': {
                return runAccessibilityTest(siteUrl)
            }
            default: {
                const result = {error: 'unsupported test type'}
                console.log('Unsupported test type result:', result)
                return result
            }
        }
    }
}
