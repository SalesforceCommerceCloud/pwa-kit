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
import logger from './logger-instance'

// Mock the logger to test warning scenarios
jest.mock('./logger-instance', () => ({
    warn: jest.fn(),
    info: jest.fn()
}))

describe('PerformanceTimer', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

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

    test('warns when mark name is undefined', () => {
        const timer = new PerformanceTimer({enabled: true})
        timer.mark(undefined, 'start')
        expect(logger.warn).toHaveBeenCalledWith(
            'Performance mark cannot be created because the name is undefined.',
            {namespace: 'performance'}
        )
        expect(timer.marks.start.size).toBe(0)
    })

    test('warns when mark name is null', () => {
        const timer = new PerformanceTimer({enabled: true})
        timer.mark(null, 'start')
        expect(logger.warn).toHaveBeenCalledWith(
            'Performance mark cannot be created because the name is undefined.',
            {namespace: 'performance'}
        )
        expect(timer.marks.start.size).toBe(0)
    })

    test('warns when mark name is empty string', () => {
        const timer = new PerformanceTimer({enabled: true})
        timer.mark('', 'start')
        expect(logger.warn).toHaveBeenCalledWith(
            'Performance mark cannot be created because the name is undefined.',
            {namespace: 'performance'}
        )
        expect(timer.marks.start.size).toBe(0)
    })

    test('warns when mark type is invalid', () => {
        const timer = new PerformanceTimer({enabled: true})
        timer.mark('test', 'invalid')
        expect(logger.warn).toHaveBeenCalledWith(
            'Performance mark cannot be created because the type must be either "start" or "end".',
            {namespace: 'performance'}
        )
        expect(timer.marks.start.size).toBe(0)
        expect(timer.marks.end.size).toBe(0)
    })

    test('handles end mark without corresponding start mark', () => {
        const timer = new PerformanceTimer({enabled: true})
        timer.mark('test', 'end')
        expect(timer.marks.end.size).toBe(1)
        expect(timer.metrics).toHaveLength(0)
    })

    test('buildServerTimingHeader creates correct format', () => {
        const timer = new PerformanceTimer({enabled: true})
        timer.mark('test1', 'start')
        timer.mark('test1', 'end')
        timer.mark('test2', 'start')
        timer.mark('test2', 'end')

        const header = timer.buildServerTimingHeader()
        expect(header).toMatch(/test1;dur=\d+\.\d{2}, test2;dur=\d+\.\d{2}/)
    })

    test('buildServerTimingHeader returns empty string when no metrics', () => {
        const timer = new PerformanceTimer({enabled: true})
        const header = timer.buildServerTimingHeader()
        expect(header).toBe('')
    })

    test('log method logs all metrics', () => {
        const timer = new PerformanceTimer({enabled: true})
        timer.mark('test1', 'start')
        timer.mark('test1', 'end')
        timer.mark('test2', 'start', {detail: 'test detail'})
        timer.mark('test2', 'end', {detail: 'test detail'})

        timer.log()

        expect(logger.info).toHaveBeenCalledTimes(2)
        expect(logger.info).toHaveBeenCalledWith(expect.stringMatching(/test1 - \d+\.\d{4}ms /), {
            namespace: 'performance'
        })
        expect(logger.info).toHaveBeenCalledWith(
            expect.stringMatching(/test2 - \d+\.\d{4}ms test detail/),
            {namespace: 'performance'}
        )
    })

    test('marks include detail when provided', () => {
        const timer = new PerformanceTimer({enabled: true})
        timer.mark('test', 'start', {detail: 'start detail'})
        timer.mark('test', 'end', {detail: 'end detail'})

        expect(timer.metrics[0].detail).toBe('end detail')
    })
})
