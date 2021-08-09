/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {
    getPerformanceTiming,
    setPerformanceValues,
    sendPerformanceEvent,
    trackFirstPaints,
    trackTTI,
    triggerSandyAppStartEvent,
    triggerNonPWAPerformanceEvent
} from './performance-timing'

import {advanceTo, clear} from 'jest-date-mock'

let realPerformance
let realProgressive
let realSetTimeout
let realAddEventListener

// The following allows window.performance to be modified
delete window.performance

beforeEach(() => {
    realPerformance = window.performance
    realProgressive = window.Progressive
    realSetTimeout = global.setTimeout
    global.setTimeout = (cb) => {
        cb()
    }
    realAddEventListener = window.addEventListener
})

afterEach(() => {
    window.performance = realPerformance
    window.Progressive = realProgressive
    global.setTimeout = realSetTimeout
    window.addEventListener = realAddEventListener
    // These were undefined to begin with so set them back
    window.attachEvent = undefined
    window.PerformanceObserver = undefined
    window.PerformanceLongTaskTiming = undefined
    window.__tti = undefined
    clear()
})

test('getPerformanceTiming returns default value if performance API is unavailable', () => {
    window.performance = undefined
    const defaultValue = 1234
    const timing = getPerformanceTiming('test', 0, defaultValue)

    expect(timing).toBe(defaultValue)
})

test('getPerformanceTiming returns calulated value if performance API is available', () => {
    window.performance = {
        timing: {
            test: 1500
        }
    }

    const timing = getPerformanceTiming('test', 250, 5)

    expect(timing).toBe(1500 - 250)
})

test('setPerformanceValues adds the PerformanceTiming object to window.Progressive', () => {
    // These will be undefined since the variables used to populate these keys are set
    // within the util file and will be undefined since window.Mobify doesn't exist in this context
    const expected = {
        pageStart: undefined,
        mobifyStart: undefined,
        timingStart: undefined
    }
    setPerformanceValues()

    expect(window.Progressive.PerformanceTiming).toMatchObject(expected)
})

test('sendPerformanceEvent sends event when window.Progressive is undefined', () => {
    window.Progressive = undefined
    const tracker = {
        sendEvent: jest.fn()
    }

    sendPerformanceEvent(tracker)
    expect(tracker.sendEvent).toHaveBeenCalled()
})

test('sendPerformanceEvent sends event when Performance timing has been set', () => {
    window.Progressive = {
        PerformanceTiming: {
            pageStart: 123,
            mobifyStart: 234,
            timingStart: 123,
            appStart: 400,
            firstPaint: 1400,
            firstContentfulPaint: 1500
        }
    }

    window.performance = {
        timing: {
            domContentLoadedEventEnd: 2000,
            loadEventEnd: 1800
        }
    }

    const tracker = {
        sendEvent: jest.fn()
    }

    sendPerformanceEvent(tracker)
    expect(tracker.sendEvent).toHaveBeenCalled()
})

test('trackFirstPaints creates an observer', () => {
    const observer = jest.fn()
    window.PerformanceObserver = function() {
        this.observe = observer
    }

    trackFirstPaints()

    expect(observer).toHaveBeenCalledWith({entryTypes: ['paint']})
})

test('trackFirstPaints does not throw errors if PerformanceObserver is undefined', () => {
    let noErrors = true
    try {
        trackFirstPaints()
    } catch (e) {
        console.log(e)
        noErrors = false
    }
    expect(noErrors).toBe(true)
})

test('trackFirstPaints adds paint timings to window.Progressive.PerformanceTiming', () => {
    // Mock the behaviour of the tracking being triggered by the browser
    let trackPaintsCallback
    window.Progressive = {
        PerformanceTiming: {}
    }
    window.PerformanceObserver = function(callback) {
        this.observe = () => {}
        trackPaintsCallback = callback
    }
    const list = {
        getEntries: () => [
            {name: 'first-paint', startTime: 100, duration: 300},
            {name: 'first-contentful-paint', startTime: 300, duration: 350},
            {name: 'skip-entry'}
        ]
    }
    trackFirstPaints()
    // Trigger the mock tracking
    trackPaintsCallback(list)

    expect(window.Progressive.PerformanceTiming).toMatchObject({
        firstPaint: 400,
        firstContentfulPaint: 650
    })
})

test('trackFirstPaints throws errors that are not a TypeError from the observer', () => {
    const expectedErrorMessage = 'This is a test Error'
    window.PerformanceLongTaskTiming = {}
    window.PerformanceObserver = function() {
        this.observe = () => {
            throw new Error(expectedErrorMessage)
        }
    }
    try {
        trackFirstPaints()
    } catch (e) {
        expect(e.message).toBe(expectedErrorMessage)
    }
})

test('trackFirstPaints does not throw TypeErrors from the observer', () => {
    let noErrors = true
    const expectedErrorMessage = 'This is a test Error'
    window.PerformanceLongTaskTiming = {}
    window.PerformanceObserver = function() {
        this.observe = () => {
            throw new TypeError(expectedErrorMessage)
        }
    }
    try {
        trackFirstPaints()
    } catch (e) {
        noErrors = false
    }
    expect(noErrors).toBe(true)
})

test('trackTTI creates an observer on the window object', () => {
    window.PerformanceLongTaskTiming = {}
    window.PerformanceObserver = function() {
        this.observe = jest.fn()
    }
    trackTTI()

    expect(window.__tti.o.observe).toHaveBeenCalledWith({entryTypes: ['longtask']})
})

test('trackTTI does not create an observer if PerformanceLongTaskTiming is unavailable', () => {
    // window.PerformanceObserver = function() {
    //     this.observe = jest.fn()
    // }
    trackTTI()

    // expect(window.__tti.o.observe).not.toHaveBeenCalledWith({entryTypes: ['longtask']})
    expect(window.__tti).not.toBeDefined()
})

test('trackTTI observer adds entries to the window object', () => {
    // Mock the behaviour of the tracking being triggered by the browser
    let trackTTICallback
    window.PerformanceLongTaskTiming = {}
    const expectedLongTasks = [{name: 'longTask-1'}, {name: 'longTask-2'}]
    window.Progressive = {
        PerformanceTiming: {}
    }
    window.PerformanceObserver = function(callback) {
        this.observe = () => {}
        trackTTICallback = callback
    }
    const list = {
        getEntries: () => expectedLongTasks
    }

    trackTTI()
    trackTTICallback(list)

    expect(window.__tti.e).toEqual(expectedLongTasks)
})

test('triggerSandyAppStartEvent initializes Sandy and tracks app data for Standalone PWAs', () => {
    // Temporarily add matchMedia() to the window so we can simulation standalone mode
    window.matchMedia = () => ({matches: true})

    setPerformanceValues()
    return triggerSandyAppStartEvent(true, 'test')
        .then(() => {
            const sandy = window.sandy.instance
            const tracker = sandy.trackers.t0

            expect(sandy).toBeDefined()
            expect(tracker.slug).toBe('test')
            expect(tracker.get('mobify_adapted')).toBe(true)
            expect(tracker.get('platform')).toBe('PWA:standalone')
        })
        .finally(() => {
            // Delete the temporary matchMedia() so other tests don't accidentally use it
            // and wrongly set to standalone mode
            delete window.matchMedia
        })
})

test('triggerSandyAppStartEvent initializes Sandy and tracks app data for PWAs', () => {
    setPerformanceValues()
    return triggerSandyAppStartEvent(true, 'test').then(() => {
        const sandy = window.sandy.instance
        const tracker = sandy.trackers.t0

        expect(sandy).toBeDefined()
        expect(tracker.slug).toBe('test')
        expect(tracker.get('mobify_adapted')).toBe(true)
        expect(tracker.get('platform')).toBe('PWA')
    })
})

test('triggerSandyAppStartEvent initializes Sandy and tracks app data for nonPWAs', () => {
    setPerformanceValues()
    return triggerSandyAppStartEvent(false, 'test').then(() => {
        const sandy = window.sandy.instance
        const tracker = sandy.trackers.t0

        expect(sandy).toBeDefined()
        expect(tracker.slug).toBe('test')
        expect(tracker.get('mobify_adapted')).toBe(false)
        expect(tracker.get('platform')).toBe('nonPWA')
    })
})

test('triggerSandyAppStartEvent sets appStart and sends timing to sandy', () => {
    advanceTo(50000)

    window.Progressive = {
        PerformanceTiming: {
            timingStart: 20000
        }
    }
    window.sandy = jest.fn()

    expect.assertions(2)
    return triggerSandyAppStartEvent(true, 'test').then(() => {
        const expectedAppStart = 30000
        expect(window.sandy).toHaveBeenCalledWith(
            'send',
            'timing',
            'timing',
            'appStart',
            '',
            expectedAppStart
        )
        expect(window.Progressive.PerformanceTiming.appStart).toBe(expectedAppStart)
    })
})

test('triggerNonPWAPerformanceEvent adds load event when addEventListener is available', () => {
    window.mockEvents = {}
    window.addEventListener = (event, cb) => {
        window.mockEvents[event] = cb
    }
    const tracker = {
        sendEvent: jest.fn()
    }

    triggerNonPWAPerformanceEvent(tracker)

    window.mockEvents.load()

    expect(tracker.sendEvent).toBeCalled()
})

test('triggerNonPWAPerformanceEvent adds load event when addEventListener is unavailable', () => {
    window.mockEvents = {}
    window.addEventListener = undefined
    window.attachEvent = (event, cb) => {
        window.mockEvents[event] = cb
    }
    const tracker = {
        sendEvent: jest.fn()
    }

    triggerNonPWAPerformanceEvent(tracker)

    window.mockEvents.onload()

    expect(tracker.sendEvent).toBeCalled()
})
