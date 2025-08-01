/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {chromium} from 'playwright'

export async function runPerformanceTest(siteUrl) {
    const browser = await chromium.launch()
    const page = await browser.newPage()

    await page.goto(siteUrl)

    // Wait for page to fully load
    await page.waitForLoadState('load')

    // Extract detailed navigation timing data from the browser
    const navigationEntries = await page.evaluate(() => {
        const nav = performance.getEntriesByType('navigation')[0]
        if (!nav) return null
        return {
            type: nav.type,
            startTime: nav.startTime,
            unloadEventStart: nav.unloadEventStart,
            unloadEventEnd: nav.unloadEventEnd,
            redirectStart: nav.redirectStart,
            redirectEnd: nav.redirectEnd,
            fetchStart: nav.fetchStart,
            domainLookupStart: nav.domainLookupStart,
            domainLookupEnd: nav.domainLookupEnd,
            connectStart: nav.connectStart,
            connectEnd: nav.connectEnd,
            secureConnectionStart: nav.secureConnectionStart,
            requestStart: nav.requestStart,
            responseStart: nav.responseStart,
            responseEnd: nav.responseEnd,
            domLoading: nav.domLoading,
            domInteractive: nav.domInteractive,
            domContentLoadedEventStart: nav.domContentLoadedEventStart,
            domContentLoadedEventEnd: nav.domContentLoadedEventEnd,
            domComplete: nav.domComplete,
            loadEventStart: nav.loadEventStart,
            loadEventEnd: nav.loadEventEnd,
            duration: nav.duration
        }
    })

    // Fallback for browsers that don't support Navigation Timing Level 2
    const perfTiming =
        navigationEntries ||
        (await page.evaluate(() => JSON.parse(JSON.stringify(window.performance.timing))))

    // Calculate key metrics
    const metrics = {
        totalLoadTime: perfTiming.loadEventEnd - perfTiming.startTime,
        domContentLoadedTime: perfTiming.domContentLoadedEventEnd - perfTiming.startTime,
        timeToFirstByte: perfTiming.responseStart - perfTiming.startTime,
        domInteractive: perfTiming.domInteractive - perfTiming.startTime,
        firstPaint: perfTiming.responseEnd - perfTiming.startTime,
        ...perfTiming // include all raw timings for reference
    }

    await browser.close()

    return {
        content: [
            {
                type: 'text',
                text: `Total Load Time: ${metrics.totalLoadTime}ms, \
        DOM Content Loaded: ${metrics.domContentLoadedTime}ms, \
        Time to First Byte: ${metrics.timeToFirstByte}ms, 
        DOM Interactive: ${metrics.domInteractive}ms, \
        First Paint: ${metrics.firstPaint}ms`
            }
        ]
    }
}
