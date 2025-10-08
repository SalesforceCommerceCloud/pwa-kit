/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {runPerformanceTest} from './site-test-performance'
import {runAccessibilityTest} from './site-test-accessibility'

export class TestWithPlaywrightTool {
    /**
     * Runs a Playwright test file by name (e.g., 'performance' or 'accessibility')
     * @param {string} testType - 'performance' or 'accessibility'
     * @param {string} siteUrl - Site URL to test
     * @returns {object} - Result of the test run
     */
    async run(testType, siteUrl) {
        if (!siteUrl) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Missing required argument: siteUrl (full site URL)'
                    }
                ]
            }
        }
        switch (testType) {
            case 'performance': {
                return runPerformanceTest(siteUrl)
            }
            case 'accessibility': {
                return runAccessibilityTest(siteUrl)
            }
            default: {
                const result = {
                    content: [
                        {
                            type: 'text',
                            text: `Unsupported test type: ${testType}. Use 'performance' or 'accessibility'.`
                        }
                    ]
                }
                console.log('Unsupported test type result:', result)
                return result
            }
        }
    }
}
