/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {execSync} from 'child_process'
import path from 'path'

// Import the new function-based tests
import { runPerformanceTest } from '../tests/performance.test.js'
import { runAccessibilityTest } from '../tests/accessibility.test.js'

const DEFAULT_SITE_URL = 'https://www.adidas.com/us';

export class TestWithPlaywrightTool {
  /**
   * Runs a Playwright test file by name (e.g., 'performance' or 'accessibility')
   * @param {string} testType - 'performance' or 'accessibility'
   * @param {string} [siteUrl] - Optional site URL to test
   * @returns {object} - Result of the test run
   */
  async run(testType, siteUrl) {
    if (testType === 'performance') {
      if (!siteUrl) {
        throw new Error('siteUrl is required for performance test');
      }
      const result = await runPerformanceTest(siteUrl || DEFAULT_SITE_URL)
      return result
    } else if (testType === 'accessibility') {
      const result = await runAccessibilityTest(siteUrl || DEFAULT_SITE_URL)
      return result
    } else {
      const result = {error: 'unsupported test type'}
      console.log('Unsupported test type result:', result)
      return result
    }
  }
}
