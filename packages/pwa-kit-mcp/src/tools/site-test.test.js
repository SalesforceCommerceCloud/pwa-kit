/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {TestWithPlaywrightTool} from './site-test'

// Mock the imported test functions to avoid running real Playwright tests
jest.mock('./site-test-performance.js', () => ({
    runPerformanceTest: jest.fn(async (url) => ({mock: 'performance', url}))
}))
jest.mock('./site-test-accessibility.js', () => ({
    runAccessibilityTest: jest.fn(async (url) => ({mock: 'accessibility', url}))
}))

const DEFAULT_SITE_URL = 'https://pwa-kit.mobify-storefront.com'

describe('TestWithPlaywrightTool', () => {
    let tool
    beforeEach(() => {
        tool = new TestWithPlaywrightTool()
    })

    it('runs performance test with provided siteUrl', async () => {
        const result = await tool.run('performance', DEFAULT_SITE_URL)
        expect(result).toEqual({mock: 'performance', url: DEFAULT_SITE_URL})
    })

    it('runs performance test with default siteUrl if not provided', async () => {
        // Remove the error throw for missing siteUrl in your implementation if you want this to pass
        const result = await tool.run('performance')
        expect(result).toEqual({mock: 'performance', url: DEFAULT_SITE_URL})
    })

    it('throws error if testType is unsupported', async () => {
        const result = await tool.run('unknown', 'https://example.com')
        expect(result).toEqual({error: 'unsupported test type'})
    })

    it('runs accessibility test with provided siteUrl', async () => {
        const result = await tool.run('accessibility', 'https://foo.com')
        expect(result).toEqual({mock: 'accessibility', url: 'https://foo.com'})
    })

    it('runs accessibility test with default siteUrl if not provided', async () => {
        const result = await tool.run('accessibility')
        expect(result).toEqual({mock: 'accessibility', url: DEFAULT_SITE_URL})
    })
})
