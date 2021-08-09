/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {GoogleAnalyticsConnector} from './google-analytics'
import {
    PAGEVIEW,
    APPLEPAYBUTTONDISPLAYED,
    APPLEPAYOPTIONDISPLAYED,
    APPLEPAYBUTTONCLICKED
} from '../types'
import * as Utils from '../utils'
import {PRODUCTIMPRESSION, PURCHASE} from '../../../dist/analytics-integrations/types'

describe('Google Analytics Connector', () => {
    beforeEach(() => {
        // Clean all scripts
        ;[...document.getElementsByTagName('script')].forEach((script) => {
            document.body.removeChild(script)
        })

        // Append first script tag
        const el = document.createElement('script')
        el.src = `/scripts/first.js`
        document.body.appendChild(el)
    })

    test('initializes with trackerName, trackerId, src (google analytics library), and ecommerceLibrary', () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec'
        })

        expect(connector.trackerName).toBe('test')
        expect(connector.trackerId).toBe('123')
        expect(connector.ecommerceLibrary).toBe('ec')
        expect(connector.src).toBe('https://www.google-analytics.com/analytics.js')
    })

    test('throws error if trackerId, trackerName not defined, but allows ecommerceLibrary to be undefined', () => {
        expect(() => {
            new GoogleAnalyticsConnector({
                trackerName: 'test'
            })
        }).toThrow()

        expect(() => {
            new GoogleAnalyticsConnector({
                trackerId: '123'
            })
        }).toThrow()

        expect(() => {
            new GoogleAnalyticsConnector({
                trackerName: 'test',
                trackerId: '123'
            })
        }).not.toThrow()
    })

    test(`If no ecommerce library specified, dont call 'loadEcommerceLibrary(); if no splitTestConfig defined, don't call setupSplitTest()`, () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123'
        })

        expect(connector.ecommerceLibrary).toBeNull()
        expect(connector.splitTestConfig).toBeNull()
        expect(connector.src).toBe('https://www.google-analytics.com/analytics.js')

        window.ga = jest.fn((arg) => {
            // Mock ga ready callback
            if (typeof arg === 'function') {
                arg()
            }
        })

        window.ga.getByName = jest.fn(() => ({
            get: jest.fn()
        }))

        jest.spyOn(Utils, 'loadScript').mockImplementation(() => Promise.resolve())
        connector.setupSplitTest = jest.fn()
        connector.loadEcommerceLibrary = jest.fn()
        expect.assertions(7)
        return connector.load().then(() => {
            expect(Utils.loadScript).toHaveBeenCalledWith(connector.src)
            expect(window.ga).toHaveBeenCalledWith('create', '123', 'auto', {name: 'test'})
            expect(connector.setupSplitTest).not.toHaveBeenCalled()
            expect(connector.loadEcommerceLibrary).not.toHaveBeenCalled()
        })
    })

    test(`throws error if ecommerceLibrary is not defined as 'ec' or 'ecommerce'`, () => {
        expect(() => {
            new GoogleAnalyticsConnector({
                trackerName: 'test',
                trackerId: '123',
                ecommerceLibrary: 'test'
            })
        }).toThrow()
    })

    test('load() loads the google-analytics library using loadScript() and sets up the GA tracker', () => {
        const splitTestConfig = {
            clientIdDimension: null,
            bucketDimension: '1',
            bucketValue: '1'
        }
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec',
            splitTestConfig
        })

        expect(connector.ecommerceLibrary).toBe('ec')

        window.ga = jest.fn((arg) => {
            // Mock ga ready callback
            if (typeof arg === 'function') {
                arg()
            }
        })

        window.ga.getByName = jest.fn(() => ({
            get: jest.fn()
        }))

        jest.spyOn(Utils, 'loadScript')
        connector.setupSplitTest = jest.fn()
        connector.loadEcommerceLibrary = jest.fn()
        expect.assertions(5)
        return connector.load().then(() => {
            expect(Utils.loadScript).toHaveBeenCalledWith(connector.src)
            expect(window.ga).toHaveBeenCalledWith('create', '123', 'auto', {name: 'test'})
            expect(connector.setupSplitTest).toHaveBeenCalledTimes(1)
            expect(connector.loadEcommerceLibrary).toHaveBeenCalledTimes(1)
        })
    })

    test('if options.gaDebug is false, then load regular ga library', () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec'
        })

        expect(connector.gaDebug).toBeFalsy()
        expect(connector.src).toEqual(`https://www.google-analytics.com/analytics.js`)
    })

    test('if options.gaDebug is true, then load ga debug library', () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec',
            gaDebug: true
        })

        expect(connector.gaDebug).toBeTruthy()
        expect(connector.src).toEqual(`https://www.google-analytics.com/analytics_debug.js`)
    })

    test('if tracker could not be retrieved by trackerName, throw error', () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec'
        })

        window.ga = jest.fn((arg) => {
            // Mock ga ready callback
            if (typeof arg === 'function') {
                arg()
            }
        })

        window.ga.getByName = jest.fn(() => undefined)

        expect.assertions(2)

        return connector.load().catch((error) => {
            expect(error).toBeInstanceOf(Error)
            expect(connector.tracker).toBeUndefined()
        })
    })

    test('If splitTestConfig is given, ga library will set up split test and print to console', () => {
        const splitTestConfig = {
            clientIdDimension: '1',
            bucketDimension: '1',
            bucketValue: '1'
        }
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec',
            splitTestConfig
        })

        connector.ga = jest.fn((x, y, callback) => {
            // Mock callback using model arg
            if (typeof callback === 'function') {
                callback({get: jest.fn()})
            }
        })

        jest.spyOn(console, 'log')

        expect(connector.splitTestConfig).toMatchObject(splitTestConfig)
        connector.setupSplitTest()
        expect(connector.ga).toHaveBeenCalledTimes(3) // ga used to setup split test.
        expect(console.log).toHaveBeenCalledWith('Split test was successfully setup')
    })

    test('If splitTestConfig is missing clientIdDimension, ignore split test setup', () => {
        const splitTestConfig = {
            clientIdDimension: null,
            bucketDimension: '1',
            bucketValue: '1'
        }
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec',
            splitTestConfig
        })

        connector.ga = jest.fn((x, y, callback) => {
            // Mock callback using model arg
            if (typeof callback === 'function') {
                callback({get: jest.fn()})
            }
        })

        jest.spyOn(console, 'log')

        expect(connector.splitTestConfig).toMatchObject(splitTestConfig)

        expect(() => connector.setupSplitTest()).toThrow()
        expect(connector.ga).not.toHaveBeenCalledTimes(3) // ga not called.
        expect(console.log).not.toHaveBeenCalled()
    })

    test('If splitTestConfig is missing bucketDimension, ignore split test setup', () => {
        const splitTestConfig = {
            clientIdDimension: '1',
            bucketDimension: null,
            bucketValue: '1'
        }
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec',
            splitTestConfig
        })

        connector.ga = jest.fn((x, y, callback) => {
            // Mock callback using model arg
            if (typeof callback === 'function') {
                callback({get: jest.fn()})
            }
        })

        jest.spyOn(console, 'log')

        expect(connector.splitTestConfig).toMatchObject(splitTestConfig)

        expect(() => connector.setupSplitTest()).toThrow()
        expect(connector.ga).not.toHaveBeenCalledTimes(3) // ga not called.
        expect(console.log).not.toHaveBeenCalled()
    })

    test('If splitTestConfig is missing bucketValue, ignore split test setup', () => {
        const splitTestConfig = {
            clientIdDimension: '1',
            bucketDimension: '1',
            bucketValue: null
        }
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec',
            splitTestConfig
        })

        connector.ga = jest.fn((x, y, callback) => {
            // Mock callback using model arg
            if (typeof callback === 'function') {
                callback({get: jest.fn()})
            }
        })

        jest.spyOn(console, 'log')

        expect(connector.splitTestConfig).toMatchObject(splitTestConfig)

        expect(() => connector.setupSplitTest()).toThrow()
        expect(connector.ga).not.toHaveBeenCalledTimes(3) // ga not called.
        expect(console.log).not.toHaveBeenCalled()
    })

    test(`load 'ec' ecommerce library if not already loaded`, () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec'
        })

        expect(connector.ecommerceLibrary).toBe('ec')
        connector.tracker = {
            plugins_: null // no plugins loaded yet.
        }

        // after a request to require the ecommerce library is finished,
        // library will be added to the tracker's plugins.
        connector.ga = jest.fn(() => {
            connector.tracker.plugins_ = {
                get: (lib) => lib === 'ec'
            }
        })

        connector.loadEcommerceLibrary()
        expect(connector.ga).toHaveBeenCalledWith(`test.require`, 'ec') // get ec library
    })

    test(`load 'ecommerce' ecommerce library if not already loaded`, () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ecommerce'
        })

        expect(connector.ecommerceLibrary).toBe('ecommerce')
        connector.tracker = {
            plugins_: null // no plugins loaded yet.
        }

        // after a request to require the ecommerce library is finished,
        // library will be added to the tracker's plugins.
        connector.ga = jest.fn(() => {
            connector.tracker.plugins_ = {
                get: (lib) => lib === 'ecommerce'
            }
        })

        connector.loadEcommerceLibrary()
        expect(connector.ga).toHaveBeenCalledWith(`test.require`, 'ecommerce') // get ecommerce library
    })

    test(`if valid ecommerce library already loaded, just return, do not re-require an ecommerce library`, () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec'
        })

        expect(connector.ecommerceLibrary).toBe('ec')
        connector.tracker = {
            plugins_: {
                get: (lib) => lib === 'ec'
            }
        }

        connector.ga = jest.fn()

        connector.loadEcommerceLibrary()
        expect(connector.ga).not.toHaveBeenCalledWith(`test.require`, 'ec') // do not get ec library
    })

    test(`if valid ecommerce library already loaded, just return, do not re-require an ecommerce library`, () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ecommerce'
        })

        expect(connector.ecommerceLibrary).toBe('ecommerce')
        connector.tracker = {
            plugins_: {
                get: (lib) => lib === 'ecommerce'
            }
        }

        connector.ga = jest.fn()

        connector.loadEcommerceLibrary()
        expect(connector.ga).not.toHaveBeenCalledWith(`test.require`, 'ecommerce') // do not get ec library
    })

    test(`throw error if ecommerce library could not be loaded`, () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec'
        })

        expect(connector.ecommerceLibrary).toBe('ec')
        connector.tracker = {
            plugins_: null // no plugins loaded yet.
        }

        // after a request to require the ecommerce library is finished,
        // library will be added to the tracker's plugins.
        // it will be falsy if there was an error loading the library.
        connector.ga = jest.fn(() => {
            connector.tracker.plugins_ = {
                get: () => false
            }
        })

        expect(() => connector.loadEcommerceLibrary()).toThrowError()
        expect(connector.ga).toHaveBeenCalledWith(`test.require`, 'ec') // get ec library
    })

    test(`track returns tracked data`, () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec'
        })

        connector.trackPageview = jest.fn(() => 'trackedData')
        expect(connector.track(PAGEVIEW)).toEqual('trackedData')
    })

    test(`track returns null if analytics event type not handled`, () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec'
        })

        connector.trackPageview = jest.fn(() => null)
        expect(connector.track('blahEvent')).toBeNull()
    })

    test(`track handles analytics event: 'pageview', 'productImpression', 'purchase', 'applepay'`, () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec'
        })

        connector.trackPageview = jest.fn()
        connector.track(PAGEVIEW)
        expect(connector.trackPageview).toHaveBeenCalled()

        connector.trackProductImpression = jest.fn()
        connector.track(PRODUCTIMPRESSION, {})
        expect(connector.trackProductImpression).toHaveBeenCalled()

        connector.trackPurchase = jest.fn()
        connector.track(PURCHASE, {})
        expect(connector.trackPurchase).toHaveBeenCalled()

        connector.trackApplePayOptionDisplayed = jest.fn()
        connector.track(APPLEPAYOPTIONDISPLAYED, {})
        expect(connector.trackApplePayOptionDisplayed).toHaveBeenCalled()

        connector.trackApplePayButtonDisplayed = jest.fn()
        connector.track(APPLEPAYBUTTONDISPLAYED, {})
        expect(connector.trackApplePayButtonDisplayed).toHaveBeenCalled()

        connector.trackApplePayButtonClicked = jest.fn()
        connector.track(APPLEPAYBUTTONCLICKED, {})
        expect(connector.trackApplePayButtonClicked).toHaveBeenCalled()
    })

    test('a pageview event sends a pageview event to ga', () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec'
        })

        connector.tracker = {
            set: jest.fn(),
            send: jest.fn()
        }

        expect(connector.trackPageview()).not.toBeUndefined()
        expect(connector.tracker.set).toHaveBeenCalled()
        expect(connector.tracker.set.mock.calls[0][0]).toEqual(`page`)
        expect(connector.tracker.send).toHaveBeenCalledWith('pageview')
    })

    test(`trackProductImpression() sends event only if ecommerce library 'ec'`, () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec'
        })

        const product = {
            id: '123',
            name: 'abc'
        }

        connector.ga = jest.fn()

        expect(connector.trackProductImpression(product)).toEqual([
            `${connector.trackerName}.ec:addImpression`,
            product
        ])
        expect(connector.ga.mock.calls[0]).toEqual([
            `${connector.trackerName}.ec:addImpression`,
            product
        ])

        const connectorNoEC = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ecommerce'
        })

        connectorNoEC.tracker = {
            send: jest.fn()
        }

        expect(connectorNoEC.trackProductImpression(product)).toBeNull()
    })

    test(`trackPurchase() sends event only differently for ecommerce library 'ec' and 'ecommerce'`, () => {
        const connectorEC = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec'
        })
        expect(connectorEC.ecommerceLibrary).toBe('ec')

        const product1 = {id: 'a1', name: 'aaa', brand: 'bbb'}
        const product2 = {id: 'a2', name: 'ccc', brand: 'ddd'}
        const purchaseData = {
            transaction: {id: '123', revenue: '123'},
            products: [product1, product2]
        }

        connectorEC.ga = jest.fn()

        expect(connectorEC.trackPurchase(Object.assign({}, purchaseData))).toEqual([
            [`${connectorEC.trackerName}.ec:addProduct`, product1],
            [`${connectorEC.trackerName}.ec:addProduct`, product2],
            [
                `${connectorEC.trackerName}.ec:setAction`,
                'purchase',
                {
                    id: '123',
                    revenue: '123'
                }
            ],
            [
                `${connectorEC.trackerName}.send`,
                'event',
                'Ecommerce',
                'Purchase',
                {nonInteraction: 1}
            ]
        ])
        expect(connectorEC.ga.mock.calls[0]).toEqual([
            `${connectorEC.trackerName}.ec:addProduct`,
            product1
        ])
        expect(connectorEC.ga.mock.calls[1]).toEqual([
            `${connectorEC.trackerName}.ec:addProduct`,
            product2
        ])
        expect(connectorEC.ga.mock.calls[2]).toEqual([
            `${connectorEC.trackerName}.ec:setAction`,
            'purchase',
            {
                id: '123',
                revenue: '123'
            }
        ])
        expect(connectorEC.ga.mock.calls[3]).toEqual([
            `${connectorEC.trackerName}.send`,
            'event',
            'Ecommerce',
            'Purchase',
            {nonInteraction: 1}
        ])

        const connectorEcommerce = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ecommerce'
        })

        connectorEcommerce.ga = jest.fn()
        expect(connectorEcommerce.ecommerceLibrary).toBe('ecommerce')

        const product1Transformed = {
            id: purchaseData.transaction.id,
            sku: 'a1',
            name: 'aaa',
            brand: 'bbb'
        }
        const product2Transformed = {
            id: purchaseData.transaction.id,
            sku: 'a2',
            name: 'ccc',
            brand: 'ddd'
        }

        expect(connectorEcommerce.trackPurchase(purchaseData)).toEqual([
            [`${connectorEcommerce.trackerName}.ecommerce:addItem`, product1Transformed],
            [`${connectorEcommerce.trackerName}.ecommerce:addItem`, product2Transformed],
            [
                `${connectorEcommerce.trackerName}.ecommerce:addTransaction`,
                {
                    id: '123',
                    revenue: '123'
                }
            ],
            [`${connectorEcommerce.trackerName}.ecommerce:send`]
        ])
        expect(connectorEcommerce.ga.mock.calls[0]).toEqual([
            `${connectorEcommerce.trackerName}.ecommerce:addItem`,
            product1Transformed
        ])
        expect(connectorEcommerce.ga.mock.calls[1]).toEqual([
            `${connectorEcommerce.trackerName}.ecommerce:addItem`,
            product2Transformed
        ])
        expect(connectorEcommerce.ga.mock.calls[2]).toEqual([
            `${connectorEcommerce.trackerName}.ecommerce:addTransaction`,
            {
                id: '123',
                revenue: '123'
            }
        ])
        expect(connectorEcommerce.ga.mock.calls[3]).toEqual([
            `${connectorEcommerce.trackerName}.ecommerce:send`
        ])
    })

    test(`trackApplePayOptionDisplayed() only sends a ga ecommerce event`, () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec'
        })

        connector.tracker = {
            send: jest.fn()
        }

        const gaEvent = [
            'event',
            'ecommerce',
            'apple pay payment option displayed',
            {nonInteraction: 1}
        ]

        expect(connector.trackApplePayOptionDisplayed()).toEqual(gaEvent)
        expect(connector.tracker.send.mock.calls[0]).toEqual(gaEvent)
    })

    test(`trackApplePayButtonDisplayed() only sends a ga ecommerce event`, () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec'
        })

        connector.tracker = {
            send: jest.fn()
        }

        const gaEvent = ['event', 'ecommerce', 'apple pay button displayed', {nonInteraction: 1}]

        expect(connector.trackApplePayButtonDisplayed()).toEqual(gaEvent)
        expect(connector.tracker.send.mock.calls[0]).toEqual(gaEvent)
    })

    test(`trackApplePayButtonClicked() only sends a ga ecommerce event`, () => {
        const connector = new GoogleAnalyticsConnector({
            trackerName: 'test',
            trackerId: '123',
            ecommerceLibrary: 'ec'
        })

        connector.tracker = {
            send: jest.fn()
        }

        const gaEvent = ['event', 'ecommerce', 'apple pay clicked']

        expect(connector.trackApplePayButtonClicked()).toEqual(gaEvent)
        expect(connector.tracker.send.mock.calls[0]).toEqual(gaEvent)
    })
})
