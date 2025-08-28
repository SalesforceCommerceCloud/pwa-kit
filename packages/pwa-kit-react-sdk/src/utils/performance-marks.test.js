/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {PERFORMANCE_MARKS} from './performance-marks'

describe('PERFORMANCE_MARKS', () => {
    test('exports all required performance mark constants', () => {
        expect(PERFORMANCE_MARKS).toEqual({
            total: 'ssr.total',
            renderToString: 'ssr.render-to-string',
            routeMatching: 'ssr.route-matching',
            loadComponent: 'ssr.load-component',
            fetchStrategies: 'ssr.fetch-strategies',
            reactQueryPrerender: 'ssr.fetch-strategies.react-query.pre-render',
            reactQueryUseQuery: 'ssr.fetch-strategies.react-query.use-query',
            getProps: 'ssr.fetch-strategies.get-prop'
        })
    })

    test('performance marks are strings', () => {
        Object.values(PERFORMANCE_MARKS).forEach((mark) => {
            expect(typeof mark).toBe('string')
            expect(mark.length).toBeGreaterThan(0)
        })
    })

    test('performance marks follow consistent naming convention', () => {
        Object.values(PERFORMANCE_MARKS).forEach((mark) => {
            expect(mark).toMatch(/^ssr\./)
        })
    })
})
