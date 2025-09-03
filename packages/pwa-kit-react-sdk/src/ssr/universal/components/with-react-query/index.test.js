/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {withReactQuery} from './index'
import {render, screen} from '@testing-library/react'
import React from 'react'
import logger from '../../../../utils/logger-instance'
import {PERFORMANCE_MARKS} from '../../../../utils/performance'

jest.mock('@tanstack/react-query', () => ({
    ...jest.requireActual('@tanstack/react-query'),
    dehydrate: jest.fn().mockReturnValue({})
}))

jest.mock('../../../../utils/logger-instance', () => {
    return {
        error: jest.fn()
    }
})

describe('withReactQuery', function () {
    let windowSpy
    let oldPreloadedState = window.__PRELOADED_STATE__

    beforeEach(() => {
        windowSpy = jest.spyOn(window, 'window', 'get')
        jest.spyOn(console, 'warn').mockImplementation(jest.fn())
    })

    afterEach(() => {
        console.warn.mockRestore()
        windowSpy.mockRestore()

        window.__PRELOADED_STATE__ = oldPreloadedState
    })

    test('Renders correctly', () => {
        const Wrapped = () => <p>Hello world</p>
        const Component = withReactQuery(Wrapped)
        render(<Component locals={{}} />)

        expect(screen.getByText(/Hello world/i)).toBeInTheDocument()
    })

    test('`beforeHydrate` called on mount', () => {
        const mockPreloadedState = {payload: {}}
        const mockBeforeHydrate = jest.fn()

        const Wrapped = () => <p>Hello world</p>
        const Component = withReactQuery(Wrapped, {
            beforeHydrate: mockBeforeHydrate
        })

        window.__PRELOADED_STATE__ = {__reactQuery: mockPreloadedState}
        render(<Component locals={{}} />)

        expect(screen.getByText(/Hello world/i)).toBeInTheDocument()
        expect(mockBeforeHydrate).toHaveBeenCalledTimes(1)
        expect(mockBeforeHydrate).toHaveBeenCalledWith(mockPreloadedState)
    })

    test('Renders correctly when `beforeHydrate` throws', () => {
        const mockPreloadedState = {payload: {}}
        const mockError = new Error('Test Error')
        const mockBeforeHydrate = jest.fn().mockImplementation(() => {
            throw mockError
        })

        const Wrapped = () => <p>Hello world</p>
        const Component = withReactQuery(Wrapped, {
            beforeHydrate: mockBeforeHydrate
        })

        window.__PRELOADED_STATE__ = {__reactQuery: mockPreloadedState}
        logger.error = jest.fn()
        render(<Component locals={{}} />)

        expect(screen.getByText(/Hello world/i)).toBeInTheDocument()
        expect(mockBeforeHydrate).toHaveBeenCalledTimes(1)
        expect(mockBeforeHydrate).toHaveBeenCalledWith(mockPreloadedState)
        expect(logger.error).toHaveBeenCalledTimes(1)
        expect(logger.error).toHaveBeenCalledWith('Client `beforeHydrate` failed', {
            additionalProperties: {error: mockError},
            namespace: 'with-react-query.render'
        })
    })

    test(`Has working getInitializers method`, () => {
        expect(withReactQuery({}).getInitializers()).toHaveLength(1)
        expect(withReactQuery({getInitializers: () => ['xyz']}).getInitializers()).toHaveLength(2)
    })

    test(`Has working getHOCsInUse method`, () => {
        expect(withReactQuery({}).getHOCsInUse()).toHaveLength(1)
        expect(withReactQuery({getHOCsInUse: () => ['xyz']}).getHOCsInUse()).toHaveLength(2)
    })

    test('Performance markers use hyphen as delimiter for displayName', async () => {
        const mockPerformanceTimer = {
            mark: jest.fn()
        }

        const mockQueryMeta = {
            displayName: 'TestQuery'
        }

        const mockQueryCache = {
            getAll: jest.fn().mockReturnValue([
                {
                    options: {enabled: true},
                    meta: mockQueryMeta,
                    queryHash: 'test-hash',
                    fetch: jest.fn().mockResolvedValue({})
                }
            ])
        }

        const mockQueryClient = {
            getQueryCache: jest.fn().mockReturnValue(mockQueryCache)
        }

        const res = {
            locals: {
                __queryClient: mockQueryClient
            },
            __performanceTimer: mockPerformanceTimer
        }

        const Component = withReactQuery({})

        await Component.doInitAppState({
            res,
            appJSX: <div>Test</div>
        })

        expect(mockPerformanceTimer.mark).toHaveBeenCalledWith(
            `${PERFORMANCE_MARKS.reactQueryUseQuery}.TestQuery-0`,
            'start'
        )

        expect(mockPerformanceTimer.mark).toHaveBeenCalledWith(
            `${PERFORMANCE_MARKS.reactQueryUseQuery}.TestQuery-0`,
            'end',
            expect.objectContaining({
                detail: 'test-hash'
            })
        )
    })

    test('Performance markers use index as displayName when meta.displayName is not available', async () => {
        const mockPerformanceTimer = {
            mark: jest.fn()
        }

        const mockQueryCache = {
            getAll: jest.fn().mockReturnValue([
                {
                    options: {enabled: true},
                    meta: {},
                    queryHash: 'test-hash',
                    fetch: jest.fn().mockResolvedValue({})
                }
            ])
        }

        const mockQueryClient = {
            getQueryCache: jest.fn().mockReturnValue(mockQueryCache)
        }

        const res = {
            locals: {
                __queryClient: mockQueryClient
            },
            __performanceTimer: mockPerformanceTimer
        }

        const Component = withReactQuery({})

        await Component.doInitAppState({
            res,
            appJSX: <div>Test</div>
        })

        // Verify the performance marker uses just the index when no displayName is available
        expect(mockPerformanceTimer.mark).toHaveBeenCalledWith(
            `${PERFORMANCE_MARKS.reactQueryUseQuery}.0`,
            'start'
        )

        expect(mockPerformanceTimer.mark).toHaveBeenCalledWith(
            `${PERFORMANCE_MARKS.reactQueryUseQuery}.0`,
            'end',
            expect.objectContaining({
                detail: 'test-hash'
            })
        )
    })

    test('Performance markers for reactQueryPrerender are set correctly', async () => {
        const mockPerformanceTimer = {
            mark: jest.fn()
        }

        const mockQueryCache = {
            getAll: jest.fn().mockReturnValue([])
        }

        const mockQueryClient = {
            getQueryCache: jest.fn().mockReturnValue(mockQueryCache)
        }

        const res = {
            locals: {
                __queryClient: mockQueryClient
            },
            __performanceTimer: mockPerformanceTimer
        }

        const Component = withReactQuery({})

        await Component.doInitAppState({
            res,
            appJSX: <div>Test</div>
        })

        // Verify the performance markers for reactQueryPrerender are set correctly
        expect(mockPerformanceTimer.mark).toHaveBeenCalledWith(
            PERFORMANCE_MARKS.reactQueryPrerender,
            'start'
        )

        expect(mockPerformanceTimer.mark).toHaveBeenCalledWith(
            PERFORMANCE_MARKS.reactQueryPrerender,
            'end'
        )
    })

    test('Performance marker is closed regardless of fetch status - success case', async () => {
        const mockPerformanceTimer = {
            mark: jest.fn()
        }

        const mockQueryCache = {
            getAll: jest.fn().mockReturnValue([
                {
                    options: {enabled: true},
                    meta: {displayName: 'SuccessQuery'},
                    queryHash: 'success-hash',
                    fetch: jest.fn().mockResolvedValue({data: 'success'})
                }
            ])
        }

        const mockQueryClient = {
            getQueryCache: jest.fn().mockReturnValue(mockQueryCache)
        }

        const res = {
            locals: {
                __queryClient: mockQueryClient
            },
            __performanceTimer: mockPerformanceTimer
        }

        const Component = withReactQuery({})

        await Component.doInitAppState({
            res,
            appJSX: <div>Test</div>
        })

        // Verify timer start is called
        expect(mockPerformanceTimer.mark).toHaveBeenCalledWith(
            `${PERFORMANCE_MARKS.reactQueryUseQuery}.SuccessQuery-0`,
            'start'
        )

        // Verify timer end is called even on successful fetch
        expect(mockPerformanceTimer.mark).toHaveBeenCalledWith(
            `${PERFORMANCE_MARKS.reactQueryUseQuery}.SuccessQuery-0`,
            'end',
            expect.objectContaining({
                detail: 'success-hash'
            })
        )
    })

    test('Performance marker is ended regardless of fetch status - error case', async () => {
        const mockPerformanceTimer = {
            mark: jest.fn()
        }

        const mockError = new Error('Fetch failed')
        const mockQueryCache = {
            getAll: jest.fn().mockReturnValue([
                {
                    options: {enabled: true},
                    meta: {displayName: 'ErrorQuery'},
                    queryHash: 'error-hash',
                    fetch: jest.fn().mockRejectedValue(mockError)
                }
            ])
        }

        const mockQueryClient = {
            getQueryCache: jest.fn().mockReturnValue(mockQueryCache)
        }

        const res = {
            locals: {
                __queryClient: mockQueryClient
            },
            __performanceTimer: mockPerformanceTimer
        }

        const Component = withReactQuery({})

        // Reset the logger mock to ensure clean state
        logger.error.mockClear()

        await Component.doInitAppState({
            res,
            appJSX: <div>Test</div>
        })

        // Verify timer start is called
        expect(mockPerformanceTimer.mark).toHaveBeenCalledWith(
            `${PERFORMANCE_MARKS.reactQueryUseQuery}.ErrorQuery-0`,
            'start'
        )

        // Verify timer end is called even when fetch fails
        expect(mockPerformanceTimer.mark).toHaveBeenCalledWith(
            `${PERFORMANCE_MARKS.reactQueryUseQuery}.ErrorQuery-0`,
            'end',
            expect.objectContaining({
                detail: 'error-hash'
            })
        )
    })

    test('Query errors are logged properly during SSR', async () => {
        const mockPerformanceTimer = {
            mark: jest.fn()
        }

        const mockError = new Error('Network timeout')
        const mockQueryCache = {
            getAll: jest.fn().mockReturnValue([
                {
                    options: {enabled: true},
                    meta: {displayName: 'FailingQuery'},
                    queryHash: 'failing-hash',
                    fetch: jest.fn().mockRejectedValue(mockError)
                }
            ])
        }

        const mockQueryClient = {
            getQueryCache: jest.fn().mockReturnValue(mockQueryCache)
        }

        const res = {
            locals: {
                __queryClient: mockQueryClient
            },
            __performanceTimer: mockPerformanceTimer
        }

        const Component = withReactQuery({})

        // Reset the logger mock to ensure clean state
        logger.error.mockClear()

        await Component.doInitAppState({
            res,
            appJSX: <div>Test</div>
        })

        // Verify that the error is logged with correct parameters
        expect(logger.error).toHaveBeenCalledTimes(1)
        expect(logger.error).toHaveBeenCalledWith('Query during SSR results in an error', {
            namespace: 'with-react-query.doInitAppState',
            additionalProperties: {
                queryHash: 'failing-hash',
                error: mockError
            }
        })
    })

    test('Multiple queries with mixed success/error status - all performance markers ended and errors logged', async () => {
        const mockPerformanceTimer = {
            mark: jest.fn()
        }

        const mockError = new Error('Second query failed')
        const mockQueryCache = {
            getAll: jest.fn().mockReturnValue([
                {
                    options: {enabled: true},
                    meta: {displayName: 'SuccessQuery'},
                    queryHash: 'success-hash',
                    fetch: jest.fn().mockResolvedValue({data: 'success'})
                },
                {
                    options: {enabled: true},
                    meta: {displayName: 'ErrorQuery'},
                    queryHash: 'error-hash',
                    fetch: jest.fn().mockRejectedValue(mockError)
                },
                {
                    options: {enabled: true},
                    meta: {},
                    queryHash: 'another-success-hash',
                    fetch: jest.fn().mockResolvedValue({data: 'another success'})
                }
            ])
        }

        const mockQueryClient = {
            getQueryCache: jest.fn().mockReturnValue(mockQueryCache)
        }

        const res = {
            locals: {
                __queryClient: mockQueryClient
            },
            __performanceTimer: mockPerformanceTimer
        }

        const Component = withReactQuery({})

        // Reset the logger mock to ensure clean state
        logger.error.mockClear()

        await Component.doInitAppState({
            res,
            appJSX: <div>Test</div>
        })

        // Verify all timers are started
        expect(mockPerformanceTimer.mark).toHaveBeenCalledWith(
            `${PERFORMANCE_MARKS.reactQueryUseQuery}.SuccessQuery-0`,
            'start'
        )
        expect(mockPerformanceTimer.mark).toHaveBeenCalledWith(
            `${PERFORMANCE_MARKS.reactQueryUseQuery}.ErrorQuery-1`,
            'start'
        )
        expect(mockPerformanceTimer.mark).toHaveBeenCalledWith(
            // Since this query does not have a displayName, the query index is used instead. That's why it says '2' here.
            `${PERFORMANCE_MARKS.reactQueryUseQuery}.2`,
            'start'
        )

        // Verify all timers are closed regardless of fetch status
        expect(mockPerformanceTimer.mark).toHaveBeenCalledWith(
            `${PERFORMANCE_MARKS.reactQueryUseQuery}.SuccessQuery-0`,
            'end',
            expect.objectContaining({
                detail: 'success-hash'
            })
        )
        expect(mockPerformanceTimer.mark).toHaveBeenCalledWith(
            `${PERFORMANCE_MARKS.reactQueryUseQuery}.ErrorQuery-1`,
            'end',
            expect.objectContaining({
                detail: 'error-hash'
            })
        )
        expect(mockPerformanceTimer.mark).toHaveBeenCalledWith(
            // Since this query does not have a displayName, the query index is used instead. That's why it says '2' here.
            `${PERFORMANCE_MARKS.reactQueryUseQuery}.2`,
            'end',
            expect.objectContaining({
                detail: 'another-success-hash'
            })
        )

        // Verify only the failing query is logged
        expect(logger.error).toHaveBeenCalledTimes(1)
        expect(logger.error).toHaveBeenCalledWith('Query during SSR results in an error', {
            namespace: 'with-react-query.doInitAppState',
            additionalProperties: {
                queryHash: 'error-hash',
                error: mockError
            }
        })
    })
})
