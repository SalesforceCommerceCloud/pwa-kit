/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {AnalyticsManager} from './analytics-manager'
import {PerformanceTracker} from './performance-tracker'
import {DOMTracker} from './dom-tracker'
import {
    PAGEVIEW,
    OFFLINE,
    UIINTERACTION,
    PERFORMANCE,
    ADDTOCART,
    REMOVEFROMCART,
    ADDTOWISHLIST,
    REMOVEFROMWISHLIST,
    PURCHASE,
    PRODUCTIMPRESSION,
    ERROR,
    LOCALE,
    performance,
    uiInteraction,
    offline,
    page,
    shoppingList,
    purchase,
    product,
    error,
    locale
} from './types'
import * as Types from './types'
import {
    APPLEPAYBUTTONCLICKED,
    APPLEPAYBUTTONDISPLAYED,
    APPLEPAYOPTIONDISPLAYED
} from '../../dist/analytics-integrations/types'

class Connector {
    load() {
        return Promise.resolve()
    }

    track(type, data) {
        return data
    }
}

describe('Analytics Manager', () => {
    beforeEach(() => {
        ;[...document.getElementsByTagName('script')].forEach((script) => {
            document.body.removeChild(script)
        })

        window.Progressive = {}

        if (document.getElementsByClassName('react-target').length !== 0) {
            document.body.removeChild(document.getElementsByClassName('react-target')[0])
        }

        // Build react-target DOM element
        const reactRoot = document.createElement('div')
        reactRoot.className = 'react-target'
        document.body.appendChild(reactRoot)

        const scriptel = document.createElement('script')
        scriptel.id = 'progressive-web-main'
        scriptel.src = '/test.js'
        document.body.appendChild(scriptel)
        console.info = jest.fn()
    })
    test('Instantiate with supplied connectors, DOM tracker, performance tracker, and other default values ', () => {
        const connector = new Connector()
        connector.load = jest.fn(() => {
            return Promise.resolve()
        })
        const am = new AnalyticsManager({
            connectors: [connector]
        })

        expect(am.connectors).toHaveLength(1)
        expect(am.connectors).toContainEqual(connector)
        expect(am.debug).toBeFalsy()
        expect(am.performanceTracker).toBeInstanceOf(PerformanceTracker)
        expect(am.domTracker).toBeInstanceOf(DOMTracker)
        expect(am.queue).toBeInstanceOf(Array)
        expect(am.queue).toHaveLength(0)
        expect(am.loaded).toBeDefined()
        expect(connector.load).toHaveBeenCalled()
    })

    test('Cannot instantiate without at least one connector', () => {
        expect(() => {
            new AnalyticsManager()
        }).toThrowError(`At least one connector is required`)
    })

    test('Track throws an error if type or data are undefined', () => {
        const am = new AnalyticsManager({
            connectors: [new Connector()]
        })
        console.error = jest.fn()

        expect(() => {
            am.track()
        }).toThrow()
    })

    test('When online and all connectors loaded, calling track() should call track() on each connector', () => {
        const connector = new Connector()
        connector.load = jest.fn()
        connector.load.mockReturnValue(Promise.resolve())
        connector.track = jest.fn()
        const am = new AnalyticsManager({
            connectors: [connector]
        })

        // online
        Object.defineProperty(window.navigator, 'onLine', {value: true, configurable: true})
        // connectors loaded (global variable that is set to true when connector async loading completes)
        am.loaded = true

        jest.spyOn(am, 'drainQueue')
        am.track('type', {data: 'data'})
        expect(am.queue).toHaveLength(0)
        expect(connector.track).toHaveBeenCalledWith('type', {data: 'data'})
        expect(am.drainQueue).toHaveBeenCalled()
    })

    test('When offline or connectors not done loading, calling track() should only add analytics event to queue', () => {
        const connector = new Connector()
        connector.load = jest.fn(() => Promise.resolve())
        connector.track = jest.fn()
        const am = new AnalyticsManager({
            connectors: [connector]
        })

        // offline
        Object.defineProperty(window.navigator, 'onLine', {value: false, configurable: true})
        // connectors loaded (global variable that is set to true when connector async loading completes)
        am.loaded = true
        expect(am.queue).toHaveLength(0)
        am.track('a', {b: 'c'})
        expect(connector.track).not.toHaveBeenCalledWith('a', {b: 'c'})
        expect(am.queue).toHaveLength(1)
        expect(am.queue).toContainEqual({type: 'a', data: {b: 'c'}})

        // online
        Object.defineProperty(window.navigator, 'onLine', {value: true, configurable: true})
        // connectors not done loading (global variable that is set to true when connector async loading completes)
        am.loaded = false
        jest.spyOn(am, 'drainQueue')
        am.track('1', {2: '3'})
        expect(connector.track).not.toHaveBeenCalledWith('1', {2: '3'})
        expect(am.drainQueue).not.toHaveBeenCalled()
        expect(am.queue).toHaveLength(2)
        expect(am.queue).toContainEqual({type: '1', data: {2: '3'}})
    })

    test('track() requires a type', () => {
        const connector = new Connector()
        connector.load = jest.fn(() => Promise.resolve())
        const am = new AnalyticsManager({
            connectors: [connector]
        })

        // online
        Object.defineProperty(window.navigator, 'onLine', {value: false, configurable: true})
        // connectors loaded (global variable that is set to true when connector async loading completes)
        am.loaded = true
        expect(am.queue).toHaveLength(0)
        expect(() => {
            am.track()
        }).toThrowError('Please specify Analytics type to track.')
    })

    test('track() requires a type and allows empty data', () => {
        const connector = new Connector()
        connector.load = jest.fn(() => Promise.resolve())
        const am = new AnalyticsManager({
            connectors: [connector]
        })

        // connectors loaded (global variable that is set to true when connector async loading completes)
        am.loaded = true
        expect(am.queue).toHaveLength(0)
        am.track('type')
        expect(am.queue).toHaveLength(1)
        expect(am.queue).toContainEqual({type: 'type'})
    })

    test('Calls logger in debug mode', () => {
        const connector = new Connector()
        connector.load = jest.fn(() => Promise.resolve())
        const am = new AnalyticsManager({
            connectors: [connector],
            debug: true // turn on debug
        })
        jest.spyOn(am, 'log')
        connector.track = jest.fn(() => 'trackedData')
        console.log = jest.fn()
        console.groupCollapsed = jest.fn()
        console.groupEnd = jest.fn()

        expect(am.debug).toBeTruthy()
        Object.defineProperty(window.navigator, 'onLine', {value: true, configurable: true})
        am.loaded = true

        am.track('type', {b: 'c'})
        expect(connector.track).toHaveBeenCalled()
        expect(am.log).toHaveBeenCalledWith(connector, 'type', 'trackedData')
        expect(console.log).toHaveBeenCalled()
        expect(console.groupCollapsed.mock.calls[0][2]).toBe('Connector')
        expect(console.groupCollapsed.mock.calls[0][5]).toBe('type')
    })

    test('Does not call logger when not in debug mode', () => {
        const connector = new Connector()
        connector.load = jest.fn(() => Promise.resolve())
        connector.track = jest.fn(() => 'trackedData')

        // Analytics Manager debug mode is false by default
        const am = new AnalyticsManager({
            connectors: [connector]
        })
        am.log = jest.fn()

        expect(am.debug).toBeFalsy()
        Object.defineProperty(window.navigator, 'onLine', {value: true, configurable: true})
        am.loaded = true

        jest.spyOn(am, 'drainQueue')
        am.track('a', {b: 'c'})
        expect(connector.track).toHaveBeenCalled()
        expect(am.drainQueue).toHaveBeenCalled()
        expect(am.log).not.toHaveBeenCalled()
    })

    test('Calling load() calls load on every connector registered with the Analytics Manager', () => {
        const connector1 = new Connector()
        const connector2 = new Connector()
        const connector3 = new Connector()
        connector1.load = jest.fn(() => {
            return Promise.resolve()
        })
        connector2.load = jest.fn(() => {
            return Promise.resolve()
        })
        connector3.load = jest.fn(() => {
            return Promise.resolve()
        })

        const am = new AnalyticsManager({
            connectors: [connector1, connector2, connector3]
        })

        expect.assertions(3)

        return am.load().then(() => {
            expect(connector1.load).toHaveBeenCalled()
            expect(connector2.load).toHaveBeenCalled()
            expect(connector3.load).toHaveBeenCalled()
        })
    })

    test('If a connector fails to load, throw error', () => {
        const connector1 = new Connector()
        const connector2 = new Connector()
        connector1.load = jest.fn(() => {
            return Promise.resolve()
        })
        connector2.load = jest.fn(() => {
            return Promise.reject()
        })

        const am = new AnalyticsManager({
            connectors: [connector1, connector2]
        })

        expect.assertions(1)

        return am.load().catch((e) => {
            expect(e).toBe('Error loading analytics')
        })
    })

    test(`trackPageLoad() calls the performance tracker's trackPageLoad()`, () => {
        const connector = new Connector()
        connector.load = jest.fn(() => {
            return Promise.resolve()
        })

        const am = new AnalyticsManager({
            connectors: [connector]
        })

        const promise = Promise.resolve()

        expect(am.performanceTracker).toBeInstanceOf(PerformanceTracker)
        am.performanceTracker.trackPageLoad = jest.fn()
        am.trackPageLoad(promise)
        expect(am.performanceTracker.trackPageLoad).toHaveBeenCalledWith(promise)
    })

    test(`track() will call validate() for given type and spec pairs`, () => {
        const connector = new Connector()
        connector.load = jest.fn(() => {
            return Promise.resolve()
        })

        const am = new AnalyticsManager({
            connectors: [connector]
        })

        Types.validate = jest.fn()
        const data = {1: '2'}
        am.track(APPLEPAYBUTTONCLICKED)
        expect(Types.validate).not.toHaveBeenCalled()
        am.track(APPLEPAYBUTTONDISPLAYED)
        expect(Types.validate).not.toHaveBeenCalled()
        am.track(APPLEPAYOPTIONDISPLAYED)
        expect(Types.validate).not.toHaveBeenCalled()
        am.track(PAGEVIEW, data)
        expect(Types.validate).toHaveBeenCalledWith(page, data)
        am.track(OFFLINE, data)
        expect(Types.validate).toHaveBeenCalledWith(offline, data)
        am.track(UIINTERACTION, data)
        expect(Types.validate).toHaveBeenCalledWith(uiInteraction, data)
        am.track(PERFORMANCE, data)
        expect(Types.validate).toHaveBeenCalledWith(performance, data)
        am.track(ADDTOCART, data)
        expect(Types.validate).toHaveBeenCalledWith(shoppingList, data)
        am.track(REMOVEFROMCART, data)
        expect(Types.validate).toHaveBeenCalledWith(shoppingList, data)
        am.track(ADDTOWISHLIST, data)
        expect(Types.validate).toHaveBeenCalledWith(shoppingList, data)
        am.track(REMOVEFROMWISHLIST, data)
        expect(Types.validate).toHaveBeenCalledWith(shoppingList, data)
        am.track(PURCHASE, data)
        expect(Types.validate).toHaveBeenCalledWith(purchase, data)
        am.track(PRODUCTIMPRESSION, data)
        expect(Types.validate).toHaveBeenCalledWith(product, data)
        am.track(ERROR, data)
        expect(Types.validate).toHaveBeenCalledWith(error, data)
        am.track(LOCALE, data)
        expect(Types.validate).toHaveBeenCalledWith(locale, data)
    })

    test('drainQueue() will call track() on every connector', () => {
        const connector1 = new Connector()
        connector1.load = jest.fn(() => Promise.resolve())
        connector1.track = jest.fn(() => 'trackedData')

        const connector2 = new Connector()
        connector2.load = jest.fn(() => Promise.resolve())
        connector2.track = jest.fn(() => 'trackedData')

        const connector3 = new Connector()
        connector3.load = jest.fn(() => Promise.resolve())
        connector3.track = jest.fn(() => 'trackedData')

        // Analytics Manager debug mode is false by default
        const am = new AnalyticsManager({
            connectors: [connector1, connector2, connector3],
            debug: true
        })
        am.log = jest.fn()

        expect(am.debug).toBeTruthy()
        am.loaded = true

        am.queue.push({type: '1', data: '2'}, {type: 'a', data: 'b'}, {type: 'y'})

        expect(am.queue.length).toBe(3)
        am.drainQueue()
        expect(am.queue.length).toBe(0)
        expect(connector1.track).toHaveBeenCalled()
        expect(connector2.track).toHaveBeenCalled()
        expect(connector3.track).toHaveBeenCalled()
        expect(am.log).toHaveBeenCalledTimes(9)
    })
})
