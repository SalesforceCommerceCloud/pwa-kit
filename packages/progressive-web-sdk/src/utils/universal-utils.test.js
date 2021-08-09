/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* global jest expect */
/* eslint-env jest */
/* eslint import/no-commonjs:0 */
/* eslint max-nested-callbacks:0 */

jest.mock('./utils', () => ({
    runningServerSide: jest.fn()
}))

jest.mock('react-dom', () => ({
    render: jest.fn((a, b, cb) => cb()),
    hydrate: jest.fn((a, b, cb) => cb())
}))

import {
    setBreakpoints,
    getBreakpoints,
    getDeployTarget,
    getProxyConfigs,
    getRequestClass,
    calculateViewportSize,
    ssrRenderingComplete,
    ssrRenderingCompleted,
    ssrRenderingFailed,
    renderOrHydrate,
    REACT_RENDER_WAIT_TIME,
    ssrRenderingCompleteThunk,
    ssrRenderingFailedThunk
} from './universal-utils'
import {updatePackageMobify} from './ssr-shared-utils'
import {setIsServerSideOrHydratingFlag} from '../store/app/actions'

import configureMockStore from 'redux-mock-store'
import thunk from 'redux-thunk'

const mockStore = configureMockStore([thunk])

const sinon = require('sinon')

describe('ssrRendering functions', () => {
    const progressive = {}

    beforeEach(() => {
        progressive.initialRenderComplete = sinon.stub()
        progressive.initialRenderFailed = sinon.stub()
        progressive.ssrRenderingCompleted = false
    })

    afterEach(() => {
        window.Progressive = undefined
    })

    test('Missing window.Progressive', () => {
        expect(ssrRenderingCompleted()).toBe(false)
        ssrRenderingComplete()
        expect(progressive.initialRenderComplete.callCount).toBe(0)
        ssrRenderingFailed()
        expect(progressive.initialRenderFailed.callCount).toBe(0)
    })

    test('ssrRenderingComplete is correctly delayed', () => {
        window.Progressive = progressive
        progressive.ssrPerformanceTimer = {
            start: sinon.stub(),
            end: sinon.stub()
        }
        expect(progressive.ssrRenderingCompleted).toBe(false)
        const state = {a: 1}

        let now
        return new Promise((resolve) => {
            progressive.initialRenderComplete = resolve
            now = Date.now()
            ssrRenderingComplete(state)
        }).then(({appState, responseOptions}) => {
            // Expect that the callback was appropriately delayed, allowing a margin of error
            // on setTimeout. Timers can trigger a callback _before_ the requested delay in some cases.
            expect(Date.now() - now).toBeGreaterThanOrEqual(0.9 * REACT_RENDER_WAIT_TIME)
            // Expect that the correct values were passed
            expect(appState).toEqual(state)
            expect(responseOptions).toEqual({})
            expect(progressive.ssrRenderingCompleted).toBe(true)
            expect(ssrRenderingCompleted()).toBe(true)
            expect(progressive.ssrPerformanceTimer.start.callCount).toBe(1)
            expect(progressive.ssrPerformanceTimer.end.callCount).toBe(1)
        })
    })

    test('ssrRenderingComplete with responseOptions', () => {
        window.Progressive = progressive
        expect(progressive.ssrRenderingCompleted).toBe(false)
        const state = {a: 2}
        const options = {statusCode: 500}

        return new Promise((resolve) => {
            progressive.initialRenderComplete = resolve
            ssrRenderingComplete(state, options)
        }).then(({appState, responseOptions}) => {
            expect(appState).toEqual(state)
            expect(responseOptions).toEqual(options)
            expect(progressive.ssrRenderingCompleted).toBe(true)
            expect(ssrRenderingCompleted()).toBe(true)
        })
    })

    test('ssrRenderingCompleteThunk', () => {
        window.Progressive = progressive
        expect(progressive.ssrRenderingCompleted).toBe(false)
        const store = mockStore({})
        store.dispatch(ssrRenderingCompleteThunk()).then(() => {
            expect(ssrRenderingCompleted()).toBe(true)
        })
    })

    test('ssrRenderingFailed', () => {
        window.Progressive = progressive
        expect(progressive.ssrRenderingCompleted).toBe(false)
        const error = new Error('Intentional test error')
        ssrRenderingFailed(error)
        expect(progressive.initialRenderFailed.calledWith(error)).toBe(true)
        expect(ssrRenderingCompleted()).toBe(true)
    })

    test('ssrRenderingFailedThunk', () => {
        window.Progressive = progressive
        expect(progressive.ssrRenderingCompleted).toBe(false)
        const store = mockStore({})
        const error = new Error('Intentional test error')
        store.dispatch(ssrRenderingFailedThunk(error))
        expect(progressive.initialRenderFailed.calledWith(error)).toBe(true)
        expect(ssrRenderingCompleted()).toBe(true)
    })
})

describe('calculateViewportSize', () => {
    const SMALL = 'SMALL'
    const MEDIUM = 'MEDIUM'
    const LARGE = 'LARGE'
    const XLARGE = 'XLARGE'
    const BREAKPOINTS = {
        [SMALL]: 0,
        [MEDIUM]: 600,
        [LARGE]: 960,
        [XLARGE]: 1280
    }

    setBreakpoints(BREAKPOINTS)

    const tests = [
        {
            innerWidth: BREAKPOINTS.XLARGE + 1,
            expected: XLARGE
        },
        {
            innerWidth: BREAKPOINTS.XLARGE,
            expected: XLARGE
        },
        {
            innerWidth: BREAKPOINTS.XLARGE - 1,
            expected: LARGE
        },
        {
            innerWidth: BREAKPOINTS.LARGE + 1,
            expected: LARGE
        },
        {
            innerWidth: BREAKPOINTS.LARGE,
            expected: LARGE
        },
        {
            innerWidth: BREAKPOINTS.LARGE - 1,
            expected: MEDIUM
        },
        {
            innerWidth: BREAKPOINTS.MEDIUM + 1,
            expected: MEDIUM
        },
        {
            innerWidth: BREAKPOINTS.MEDIUM,
            expected: MEDIUM
        },
        {
            innerWidth: BREAKPOINTS.MEDIUM - 1,
            expected: SMALL
        }
    ]

    tests.forEach((config) => {
        test(`window.innerWidth=${config.innerWidth}`, () => {
            expect(calculateViewportSize(config.innerWidth)).toEqual(config.expected)
        })
    })
})

describe('breakpoint interfaces', () => {
    const BREAKPOINTS = {
        MEDIUM: 600,
        LARGE: 960,
        XLARGE: 1280
    }

    const NEW_BREAKPOINTS = {
        MEDIUM: 200,
        LARGE: 300,
        XLARGE: 400
    }

    const tests = [
        {},
        BREAKPOINTS,
        NEW_BREAKPOINTS,
        {MEDIUM: NEW_BREAKPOINTS.MEDIUM},
        {MEDIUM: NEW_BREAKPOINTS.MEDIUM, LARGE: NEW_BREAKPOINTS.LARGE},
        {MEDIUM: NEW_BREAKPOINTS.MEDIUM, XLARGE: NEW_BREAKPOINTS.XLARGE},
        {LARGE: NEW_BREAKPOINTS.LARGE},
        {LARGE: NEW_BREAKPOINTS.LARGE, XLARGE: NEW_BREAKPOINTS.XLARGE},
        {XLARGE: NEW_BREAKPOINTS.XLARGE}
    ]

    tests.forEach((newBreakpoint) => {
        test(`breakpoints=${JSON.stringify(newBreakpoint)}`, () => {
            // set the default breakpoints
            setBreakpoints(BREAKPOINTS)
            // set the breakpoints for the test (can set 0-3 values)
            setBreakpoints(newBreakpoint)
            // use the test breakpoints
            const currentBreakpoints = getBreakpoints()
            // check if each key-value pair matches
            expect(currentBreakpoints).toMatchObject(newBreakpoint)
        })
    })

    test('should throw if argument is empty', () => {
        const t = () => setBreakpoints()
        expect(t).toThrow(TypeError)
    })

    test('should throw if argument is not an object', () => {
        const t = () => setBreakpoints('not an object')
        expect(t).toThrow(TypeError)
    })

    test('should throw if argument does not contain values that are numbers', () => {
        const t = () => setBreakpoints({testBreakpoint: 'not a number'})
        expect(t).toThrow(TypeError)
    })
})

describe('getProxyConfigs (UPWA mode)', () => {
    test('empty default', () => {
        window.Progressive = {}
        expect(getProxyConfigs()).toEqual([])
    })

    test('gets correct value', () => {
        window.Progressive = {
            ssrOptions: {
                proxyConfigs: [
                    {
                        protocol: 'https',
                        host: 'somewhere.over.the.rainbow',
                        path: 'base'
                    }
                ]
            }
        }
        expect(getProxyConfigs()).toEqual(window.Progressive.ssrOptions.proxyConfigs)
    })
})

describe('window.Progressive access', () => {
    const savedProgressive = window.Progressive
    beforeEach(() => {
        console.log('Clearing window.Progressive')
        window.Progressive = null
        updatePackageMobify({})
    })

    afterEach(() => {
        console.log('Restoring window.Progressive')
        window.Progressive = savedProgressive
    })

    test('getProxyConfigs has empty default', () => {
        window.Progressive = {}
        expect(getProxyConfigs()).toEqual([])
    })

    test('getProxyConfigs', () => {
        updatePackageMobify({
            ssrParameters: {
                proxyProtocol1: 'https',
                proxyHost1: 'somewhere.over.the.rainbow',
                proxyPath1: 'base'
            }
        })
        expect(getProxyConfigs()).toEqual([
            {
                protocol: 'https',
                host: 'somewhere.over.the.rainbow',
                path: 'base'
            }
        ])
    })

    test('getRequestClass', () => {
        window.Progressive = {
            ssrOptions: {}
        }
        expect(getRequestClass()).toBeUndefined()
        window.Progressive.ssrOptions.requestClass = 'bot'
        expect(getRequestClass()).toEqual('bot')
    })
})

describe('getDeployTarget', () => {
    test('empty default', () => {
        window.Progressive = {}
        expect(getDeployTarget()).toEqual('')
    })

    test('gets correct value', () => {
        window.Progressive = {
            ssrOptions: {
                deployTarget: 'abcdef'
            }
        }
        expect(getDeployTarget()).toEqual(window.Progressive.ssrOptions.deployTarget)
    })
})

describe('renderOrHydrate', () => {
    // mock modules and functions
    const runningServerSide = require('./utils').runningServerSide
    const render = require('react-dom').render
    const hydrate = require('react-dom').hydrate
    const callback = jest.fn()

    // mock arguments... these don't really matter, we aren't testing the
    // functionality of the render or hydrate functions themselves.
    const COMPONENT = '<div />' // usually is a JSX React component
    const TARGET_ELEMENT = document.createElement('div')

    // Mock store DOES matter! We need to verify dispatched actions were
    // actually dispatched!
    let store

    // Expected result from internal action
    const expectedActions = [setIsServerSideOrHydratingFlag(false)]

    beforeEach(() => {
        window.Progressive = {}
        store = mockStore({})

        expect(render, 'render should NOT be called').not.toBeCalled()
        expect(hydrate, 'hydrate should NOT be called').not.toBeCalled()
        expect(callback, 'callback should NOT be called').not.toBeCalled()
    })

    afterEach(() => {
        delete window.Progressive
    })

    test('runs `render` if is NOT universal OR is running on server side', () => {
        window.Progressive.isUniversal = false
        runningServerSide.mockReturnValue(true)

        renderOrHydrate(COMPONENT, store, TARGET_ELEMENT, callback)
        expect(render, 'render should be called').toBeCalled()
        expect(hydrate, 'hydrate should NOT be called').not.toBeCalled()
        expect(callback, 'callback should be called').toBeCalled()
    })

    test('runs `hydrate` if is universal AND NOT running on server side', () => {
        window.Progressive.isUniversal = true
        runningServerSide.mockReturnValue(false)

        renderOrHydrate(COMPONENT, store, TARGET_ELEMENT, callback)
        expect(render, 'render should NOT be called').not.toBeCalled()
        expect(hydrate, 'hydrate should be called').toBeCalled()
        expect(callback, 'callback should be called').toBeCalled()
        expect(store.getActions()).toEqual(expectedActions)
    })

    test('The callback can be omitted', () => {
        renderOrHydrate(COMPONENT, store, TARGET_ELEMENT)
        expect(callback, 'callback should NOT be called').not.toBeCalled()
    })
})
