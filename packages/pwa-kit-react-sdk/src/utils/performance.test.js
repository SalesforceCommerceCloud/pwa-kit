/**
 * @jest-environment node
 */
/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// The @jest-environment comment block *MUST* be the first line of the file for the tests to pass.
// That conflicts with the monorepo header rule, so we must disable the rule!
/* eslint-disable header/header */

import PerformanceTimer from './performance'

describe('PerformanceTimer', () => {
    test('is disabled by default', () => {
        const timer = new PerformanceTimer()
        timer.mark('test', 'start')
        expect(timer.marks.start.size).toBe(0)
    })

    test('can be enabled', () => {
        const timer = new PerformanceTimer({enabled: true})
        timer.mark('test', 'start')
        expect(timer.marks.start.size).toBe(1)
    })
})

// describe('buildServerTimingHeader', () => {
//     test('should return an empty string if no performance metrics are provided', () => {
//         const result = buildServerTimingHeader([])
//         expect(result).toBe('')
//     })

//     test('should build the Server-Timing header', () => {
//         const metrics = [
//             {
//                 name: 'fetch-stragegies:react-query:use-query:0',
//                 duration: 1000,
//                 detail: 'useProduct'
//             },
//             {name: 'total', duration: 1900, detail: null}
//         ]
//         const result = buildServerTimingHeader(metrics)
//         expect(result).toBe('fetch-stragegies:react-query:use-query:0;dur=1000, total;dur=1900')
//     })
// })

// describe('clearPerformanceMarks', () => {
//     afterEach(() => {
//         performance.clearMarks()
//     })
//     test('should clear all performance marks created by the sdk', () => {
//         performance.mark('pwa-kit-react-sdk:ssr:total:start')
//         performance.mark('non-sdk:random:mark')
//         const marks = performance.getEntriesByType('mark')
//         expect(marks).toHaveLength(2)
//         clearPerformanceMarks()
//         const clearedMarks = performance.getEntriesByType('mark')
//         expect(clearedMarks).toHaveLength(1)
//     })
// })
