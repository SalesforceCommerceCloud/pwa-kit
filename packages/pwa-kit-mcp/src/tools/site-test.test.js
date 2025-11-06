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

const TEST_SITE_URL = 'https://pwa-kit.mobify-storefront.com'

describe('TestWithPlaywrightTool', () => {
    let tool
    beforeEach(() => {
        tool = new TestWithPlaywrightTool()
    })

    it('runs performance test with provided siteUrl', async () => {
        const result = await tool.run('performance', TEST_SITE_URL)
        expect(result).toEqual({mock: 'performance', url: TEST_SITE_URL})
    })

    it('returns structured error if siteUrl is missing for performance test', async () => {
        const result = await tool.run('performance')
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: 'Missing required argument: siteUrl (full site URL)'
                }
            ]
        })
    })

    it('returns structured error for unsupported test type', async () => {
        const result = await tool.run('unknown', 'https://example.com')
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: "Unsupported test type: unknown. Use 'performance' or 'accessibility'."
                }
            ]
        })
    })

    it('runs accessibility test with provided siteUrl', async () => {
        const result = await tool.run('accessibility', 'https://foo.com')
        expect(result).toEqual({mock: 'accessibility', url: 'https://foo.com'})
    })

    it('returns structured error if siteUrl is missing for accessibility test', async () => {
        const result = await tool.run('accessibility')
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: 'Missing required argument: siteUrl (full site URL)'
                }
            ]
        })
    })
})
