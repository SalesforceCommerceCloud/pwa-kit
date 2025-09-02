/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const {test, expect} = require('@playwright/test')
const config = require('../config')
const {answerConsentTrackingForm} = require('../scripts/pageHelpers.js')

test.beforeEach(async ({page}) => {
    // Enable request interception to capture headers
    await page.route('**/*', async (route) => {
        await route.continue()
    })
})

test.skip('should inject B3 headers when __server_timing param is passed', async ({page}) => {
    const url = `${config.RETAIL_APP_HOME}?__server_timing=true`

    const responseHeaders = []
    page.on('response', (response) => {
        if (response.url().includes(config.RETAIL_APP_HOME)) {
            const headers = response.headers()
            responseHeaders.push({
                url: response.url(),
                headers: headers
            })
        }
    })

    await page.goto(url)
    await answerConsentTrackingForm(page)

    expect(responseHeaders.length).toBeGreaterThan(0)

    const mainResponse = responseHeaders.find(
        (r) => r.url.includes(config.RETAIL_APP_HOME) && !r.url.includes('static')
    )

    if (mainResponse) {
        expect(mainResponse.headers).toBeDefined()

        expect(mainResponse.headers['x-b3-traceid']).toBeDefined()
        expect(mainResponse.headers['x-b3-spanid']).toBeDefined()
        expect(mainResponse.headers['x-b3-sampled']).toBe('1')

        // Verify trace ID format (should be 16 or 32 character hex string)
        const traceId = mainResponse.headers['x-b3-traceid']
        expect(traceId).toMatch(/^[0-9a-f]{16}$|^[0-9a-f]{32}$/)

        // Verify span ID format (should be 16 character hex string)
        const spanId = mainResponse.headers['x-b3-spanid']
        expect(spanId).toMatch(/^[0-9a-f]{16}$/)
    }
})

test('should not show Server Timing header if __server_timing param is not passed', async ({
    page
}) => {
    const url = config.RETAIL_APP_HOME // No __server_timing param

    const responseHeaders = []
    page.on('response', (response) => {
        if (response.url().includes(config.RETAIL_APP_HOME)) {
            const headers = response.headers()
            responseHeaders.push({
                url: response.url(),
                headers: headers
            })
        }
    })

    await page.goto(url)
    await answerConsentTrackingForm(page)

    expect(responseHeaders.length).toBeGreaterThan(0)

    const mainResponse = responseHeaders.find(
        (r) => r.url.includes(config.RETAIL_APP_HOME) && !r.url.includes('static')
    )

    expect(mainResponse).toBeDefined()
    expect(mainResponse.headers['server-timing']).toBeUndefined()
})

test('should validate performance marks in Server-Timing header have numeric durations', async ({
    page
}) => {
    const url = `${config.RETAIL_APP_HOME}?__server_timing=true`

    const responseHeaders = []
    page.on('response', (response) => {
        if (response.url().includes(config.RETAIL_APP_HOME)) {
            const headers = response.headers()
            responseHeaders.push({
                url: response.url(),
                headers: headers
            })
        }
    })

    await page.goto(url)
    await answerConsentTrackingForm(page)

    expect(responseHeaders.length).toBeGreaterThan(0)

    const mainResponse = responseHeaders.find(
        (r) => r.url.includes(config.RETAIL_APP_HOME) && !r.url.includes('static')
    )

    if (mainResponse && mainResponse.headers['server-timing']) {
        const serverTiming = mainResponse.headers['server-timing']

        // Parse timing entries and validate durations
        const timingEntries = serverTiming.split(', ')
        timingEntries.forEach((entry) => {
            const match = entry.match(/^([^;]+);dur=(\d+\.\d+)$/)
            expect(match).toBeTruthy()

            const markName = match[1]
            const duration = parseFloat(match[2])

            // Duration should be a positive number
            expect(duration).toBeGreaterThan(0)
            expect(duration).toBeLessThan(10000) // Reasonable upper bound

            // Should be one of the expected performance marks
            // Handle various suffixes by extracting the base mark name
            // Remove any suffix after the base mark name (e.g., .1, .useCategory-0, .useProductSearch-2)
            const baseMarkName = markName
                .replace(/\.(useCategory|useProductSearch|useQuery)-\d+$/, '')
                .replace(/\.\d+$/, '')
            const expectedMarks = [
                'ssr.total',
                'ssr.render-to-string',
                'ssr.route-matching',
                'ssr.load-component',
                'ssr.fetch-strategies',
                'ssr.fetch-strategies.react-query.pre-render',
                'ssr.fetch-strategies.react-query.use-query',
                'ssr.fetch-strategies.get-prop'
            ]
            expect(expectedMarks).toContain(baseMarkName)
        })
    }
})
