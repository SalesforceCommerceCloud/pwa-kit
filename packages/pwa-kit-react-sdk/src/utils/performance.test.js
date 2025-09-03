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

    test('marks can be added for both types', () => {
        const timer = new PerformanceTimer({enabled: true})
        timer.mark('test', 'start')
        timer.mark('test', 'end')
        expect(timer.marks.start.size).toBe(1)
        expect(timer.marks.end.size).toBe(1)
    })

    test('measurements are created when a pair of marks is added', () => {
        const timer = new PerformanceTimer({enabled: true})
        timer.mark('test', 'start')
        timer.mark('test', 'end')
        expect(timer.metrics).toHaveLength(1)
        expect(timer.metrics[0].name).toBe('test')
        expect(parseFloat(timer.metrics[0].duration)).toBeGreaterThan(0)
    })
})
