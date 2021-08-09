/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import EngagementEngine from './connector'
import Sandy from 'sandy-tracking-pixel-client'
import Immutable from 'immutable'

// We are mocking the console outputs because we are testing debug information is outputting
// but this makes the terminal screen really noisy. Below is a toggle to see console output
const showOutput = false
const appState = {app: Immutable.fromJS({standaloneApp: false})}

const projectSlug = 'test'
const initOption = {
    projectSlug,
    debug: true
}

const consoleErr = window.console.error
const consoleWarn = window.console.warn
const consoleInfo = window.console.info
const consoleLog = window.console.log

// Mocking the console object
const wrapOutputWithJest = (originalFn) => {
    return jest.fn((...args) => {
        if (showOutput) {
            originalFn.apply(this, args)
        }
    })
}

// Make sure we have a clean call queue every test
const mockConsoleOutput = () => {
    window.console.error = wrapOutputWithJest(consoleErr)
    window.console.warn = wrapOutputWithJest(consoleWarn)
    window.console.info = wrapOutputWithJest(consoleInfo)
    window.console.log = wrapOutputWithJest(consoleLog)

    // These functions don't exist in jsDom
    window.console.groupCollapsed = jest.fn()
    window.console.groupEnd = jest.fn()
}

// Sandy's pixel firing function - Make sure we have a clean call queue every test
const sandyTrack = Sandy._track
const mockSandyTrack = () => {
    Sandy._track = sandyTrack
    Sandy._track = jest.fn()
}

const initEngagementEngine = (option) => {
    Sandy.init(window)
    window.sandy.instance = Sandy
    const ee = new EngagementEngine(option)

    return {
        sandy: window.sandy.instance,
        tracker: window.sandy.instance.trackers.t0,
        ee
    }
}

describe('Engagement Engine Connector', () => {
    beforeEach(() => {
        mockConsoleOutput()
        mockSandyTrack()
        window.sandy = undefined
    })

    test('initializes', () => {
        expect(window.sandy).toBeUndefined()

        const {ee} = initEngagementEngine({projectSlug})

        expect(ee).toBeDefined()
        expect(ee.name).toBe('EngagementEngine')
        expect(ee.options).toBeDefined()
        expect(ee.options.projectSlug).toBe(projectSlug)
    })

    test('to throw when projectSlug is not provided', () => {
        let ee

        expect(() => {
            ee = new EngagementEngine()
        }).toThrow()

        expect(ee).toBeUndefined()
    })

    test('to be graceful when window.sandy is not there', () => {
        const ee = new EngagementEngine(initOption)

        expect(ee).toBeDefined()
        expect(window.console.error.mock.calls.length).toBe(1)
        expect(window.console.error.mock.calls[0][0]).toBe('Sandy instance does not exist')
    })

    test('runs ready when script is loaded', () => {
        const {sandy, tracker, ee} = initEngagementEngine(initOption)

        expect(sandy).toBeDefined()
        expect(tracker.slug).toBe('test')
        expect(tracker.get('mobify_adapted')).toBe(true)
        expect(ee.isReady).toBe(true)
        expect(typeof window.sandy).toBe('function')
        expect(typeof window.sandy.instance).toBe('object')
    })

    test('sets tracker channel to "test" and outputs debug infomation when debug is set to true', () => {
        const {ee} = initEngagementEngine(initOption)
        ee.receive('pageview', {templateName: 'test'}, appState)

        expect(window.console.groupCollapsed.mock.calls.length).toBe(1)
        expect(window.console.groupEnd.mock.calls.length).toBe(1)

        expect(Sandy._track.mock.calls[0][1].channel).toBe('test')
    })

    test('sets tracker channel to "web" by default', () => {
        const {ee} = initEngagementEngine({projectSlug})

        ee.receive('pageview', {templateName: 'test'}, appState)

        expect(Sandy._track.mock.calls[0][1].channel).toBe('web')
    })

    test('Outputs debug info even for non registered events', () => {
        const {ee} = initEngagementEngine({projectSlug})

        ee.debug('test', {
            data: {
                action: 'test'
            }
        })

        expect(window.console.groupCollapsed.mock.calls.length).toBe(1)
        expect(window.console.log.mock.calls.length).toBe(1)
        expect(window.console.groupEnd.mock.calls.length).toBe(1)
    })

    test('on pageview event, templateName is set', () => {
        const templateName = 'template'
        const {tracker, ee} = initEngagementEngine(initOption)

        ee.receive(
            'pageview',
            {
                templateName,
                someOtherKey: 'other'
            },
            appState
        )

        expect(tracker.get('templateName')).toBe(templateName)
        expect(tracker.get('page')).toBe('/')
        expect(tracker.get('title')).toBe('')
        expect(tracker.get('location')).toBe('http://localhost/')
    })

    test('on pageview event, dimensions are set when provided', () => {
        const templateName = 'template'
        const page = '/test.html'
        const title = 'Test title'
        const location = 'http://www.example.com'
        const {tracker, ee} = initEngagementEngine(initOption)

        ee.receive(
            'pageview',
            {
                templateName,
                path: page,
                title,
                location
            },
            appState
        )

        expect(tracker.get('templateName')).toBe(templateName)
        expect(tracker.get('page')).toBe(page)
        expect(tracker.get('title')).toBe(title)
        expect(tracker.get('location')).toBe(location)
    })

    test('on pageview event, platform is set to "PWA"', () => {
        const {tracker, ee} = initEngagementEngine(initOption)
        ee.receive('pageview', {templateName: 'test'}, appState)

        expect(tracker.get('platform')).toBe('PWA')
    })

    test('on purchase event, we can sent a tracker with all basic requirements met', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.send = jest.fn()

        ee.receive('purchase', {
            transaction: {
                id: '123',
                revenue: '10.00',
                someOtherKey: 'other'
            },
            products: []
        })

        const trackerTransactionData = ee.send.mock.calls[0][1]
        expect(trackerTransactionData.data.action).toBe('purchase')
        expect(trackerTransactionData.data.category).toBe('ecommerce')
        expect(trackerTransactionData.dimensions.transaction_id).toBe('123')
        expect(trackerTransactionData.dimensions.revenue).toBe('10.00')
        expect(trackerTransactionData.dimensions.someOtherKey).toBeUndefined()
    })

    test('on purchase event, we can sent an event with 1 product information', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.send = jest.fn()

        ee.receive('purchase', {
            transaction: {
                id: 'T-123',
                revenue: '10.00'
            },
            products: [
                {
                    id: 'P-123',
                    name: 'product name',
                    price: '9.50',
                    quantity: 1,
                    someOtherKey: 'other'
                }
            ]
        })

        const trackerProduct1Data = ee.send.mock.calls[0][1]
        const trackerTransactionData = ee.send.mock.calls[1][1]

        expect(trackerTransactionData.data.action).toBe('purchase')
        expect(trackerTransactionData.data.category).toBe('ecommerce')
        expect(trackerTransactionData.dimensions.transaction_id).toBe('T-123')
        expect(trackerTransactionData.dimensions.revenue).toBe('10.00')

        expect(trackerProduct1Data.data.action).toBe('purchase.product')
        expect(trackerProduct1Data.data.category).toBe('ecommerce')
        expect(trackerProduct1Data.dimensions.transaction_id).toBe('T-123')
        expect(trackerProduct1Data.dimensions.product_id).toBe('P-123')
        expect(trackerProduct1Data.dimensions.name).toBe('product name')
        expect(trackerProduct1Data.dimensions.price).toBe('9.50')
        expect(trackerProduct1Data.dimensions.quantity).toBe('1')
        expect(trackerTransactionData.dimensions.someOtherKey).toBeUndefined()
    })

    test('on purchase event, we can sent an event with multiple product information and any monetary values are sanitized and normalized', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()

        // Same test set as Sandy Luigi - https://github.com/mobify/sandy-luigi-tasks/blob/master/tests/test_utils.py#L107
        ee.receive('purchase', {
            transaction: {
                id: 'T-123',
                revenue: 'USD 1.23',
                tax: '20,33',
                shipping: '1600,3'
            },
            products: [
                {
                    id: 'P-123-1',
                    name: 'product name 1',
                    price: '3,000',
                    quantity: 1
                },
                {
                    id: 'P-123-2',
                    name: 'product name 2',
                    price: ' 123,400.33',
                    quantity: '1'
                },
                {
                    id: 'P-123-3',
                    name: 'product name 3',
                    price: '109.',
                    quantity: '1'
                }
            ]
        })

        const testProductData = (productData, index, expectedPrice) => {
            expect(productData.data.action).toBe('purchase.product')
            expect(productData.dimensions.transaction_id).toBe('T-123')
            expect(productData.dimensions.product_id).toBe(`P-123-${index}`)
            expect(productData.dimensions.name).toBe(`product name ${index}`)
            expect(productData.dimensions.price).toBe(expectedPrice)
            expect(productData.dimensions.quantity).toBe('1')
        }

        const trackerTransactionData = ee.tracker.sendEvent.mock.calls[3][0]

        expect(trackerTransactionData.data.action).toBe('purchase')
        expect(trackerTransactionData.dimensions.revenue).toBe('1.23')
        expect(trackerTransactionData.dimensions.tax).toBe('20.33')
        expect(trackerTransactionData.dimensions.shipping).toBe('1600.3')

        testProductData(ee.tracker.sendEvent.mock.calls[0][0], 1, '3000')
        testProductData(ee.tracker.sendEvent.mock.calls[1][0], 2, '123400.33')
        testProductData(ee.tracker.sendEvent.mock.calls[2][0], 3, '109')
    })

    test('on add to cart event we can send an empty product', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()

        ee.receive('addToCart', {
            cart: {
                type: 'cart',
                count: '42',
                subTotal: '10',
                someOtherKey: 'other'
            }
        })

        expect(ee.tracker.sendEvent.mock.calls[0][0].data.action).toBe('addToCart')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.cart_items).toBe('42')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.product_name).toBeUndefined()
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.someOtherKey).toBeUndefined()
    })

    test('on remove from cart event we can send an empty hash', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()

        ee.receive('removeFromCart', {
            cart: {
                type: 'cart',
                count: '42',
                subTotal: '10'
            }
        })
        expect(ee.tracker.sendEvent.mock.calls[0][0].data.action).toBe('removeFromCart')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.cart_items).toBe('42')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.product_name).toBeUndefined()
    })

    test('on add to cart event, we can sent an event with minimal requirements', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()

        ee.receive('addToCart', {
            cart: {
                type: 'cart',
                count: '42',
                subTotal: '10'
            },
            product: {
                id: 'id-1234',
                name: 'Eye of newt',
                someOtherKey: 'other'
            }
        })

        expect(ee.tracker.sendEvent.mock.calls[0][0].data.action).toBe('addToCart')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.cart_items).toBe('42')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.product_id).toBe('id-1234')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.someOtherKey).toBeUndefined()
    })

    test('on remove from cart event, we can sent an event with minimal requirements', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()

        ee.receive('removeFromCart', {
            cart: {
                type: 'cart',
                count: '42',
                subTotal: '10'
            },
            product: {
                id: 'id-1234',
                name: 'Eye of newt'
            }
        })

        expect(ee.tracker.sendEvent.mock.calls[0][0].data.action).toBe('removeFromCart')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.cart_items).toBe('42')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.product_id).toBe('id-1234')
    })

    test('on add to wishlist event we can send an empty product', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()

        ee.receive('addToWishlist', {
            cart: {
                type: 'wishlist',
                count: '42'
            }
        })

        expect(ee.tracker.sendEvent.mock.calls[0][0].data.action).toBe('addToWishlist')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.cart_items).toBe('42')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.someOtherKey).toBeUndefined()
    })

    test('on remove from wishlist event we can send an empty hash', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()

        ee.receive('removeFromWishlist', {
            cart: {
                type: 'wishlist',
                count: '42'
            }
        })
        expect(ee.tracker.sendEvent.mock.calls[0][0].data.action).toBe('removeFromWishlist')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.cart_items).toBe('42')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.product_name).toBeUndefined()
    })

    test('on add to wishlist event, we can sent an event with minimal requirements', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()

        ee.receive('addToWishlist', {
            cart: {
                type: 'wishlist',
                count: '42'
            },
            product: {
                id: 'id-1234',
                name: 'Eye of newt',
                someOtherKey: 'other'
            }
        })

        expect(ee.tracker.sendEvent.mock.calls[0][0].data.action).toBe('addToWishlist')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.cart_items).toBe('42')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.product_id).toBe('id-1234')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.someOtherKey).toBeUndefined()
    })

    test('on remove from wishlist event, we can sent an event with minimal requirements', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()

        ee.receive('removeFromWishlist', {
            cart: {
                type: 'wishlist',
                count: '42'
            },
            product: {
                id: 'id-1234',
                name: 'Eye of newt'
            }
        })

        expect(ee.tracker.sendEvent.mock.calls[0][0].data.action).toBe('removeFromWishlist')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.cart_items).toBe('42')
        expect(ee.tracker.sendEvent.mock.calls[0][0].dimensions.product_id).toBe('id-1234')
    })

    test('on ui interaction event, we can sent an event with minimal requirements', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()

        ee.receive('uiInteraction', {
            subject: 'app',
            object: 'Modal',
            action: 'Open'
        })

        expect(ee.tracker.sendEvent.mock.calls[0][0].data.action).toBe('appOpenModal')
    })

    test('on ui interaction event, we can sent an event with all data', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()

        ee.receive('uiInteraction', {
            subject: 'app',
            object: 'Modal',
            action: 'Open',
            name: 'Modal Name',
            content: 'Modal content',
            someOtherKey: 'other'
        })

        const mockedData = ee.tracker.sendEvent.mock.calls[0][0]

        expect(mockedData.data.action).toBe('appOpenModal')
        expect(mockedData.dimensions.container_name).toBe('Modal Name')
        expect(mockedData.dimensions.content).toBe('Modal content')
        expect(mockedData.dimensions.someOtherKey).toBeUndefined()
    })

    test('on search event, we can sent an event with all data', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()

        ee.receive('search', {
            query: 'test'
        })

        const mockedData = ee.tracker.sendEvent.mock.calls[0][0]

        expect(mockedData.data.action).toBe('search')
        expect(mockedData.dimensions.content).toBe('test')
    })

    test('on set currency event, we set the sandy tracker currency code dimension', () => {
        const {tracker, ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()

        ee.receive('setCurrency', {
            currencyCode: 'EUR'
        })

        expect(tracker.get('currency_code')).toBe('EUR')
    })

    test('on set page template name, we set the template name', () => {
        const {tracker, ee} = initEngagementEngine(initOption)
        const templateName = 'cart'

        ee.tracker.sendEvent = jest.fn()

        ee.receive('setPageTemplateName', {
            templateName
        })

        expect(tracker.get('templateName')).toBe(templateName)
    })

    test('on performance event, we send first load performance metrics', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()

        ee.receive('performance', {
            bundle: 'development',
            pageStart: 1,
            mobifyStart: 2,
            timingStart: 3,
            firstPaint: 4,
            firstContentfulPaint: 5,
            appStart: 6,
            templateWillMount: 7,
            templateDidMount: 8,
            templateAPIEnd: 9,
            timeToInteractive: 10
        })

        const mockedData = ee.tracker.sendEvent.mock.calls[0][0]
        const dimensions = mockedData.dimensions

        expect(mockedData.data.action).toBe('performance')
        expect(dimensions.bundle).toBe('development')
        expect(dimensions.page_start).toBe(1)
        expect(dimensions.mobify_start).toBe(2)
        expect(dimensions.timing_start).toBe(3)
        expect(dimensions.first_paint).toBe(4)
        expect(dimensions.first_contentful_paint).toBe(5)
        expect(dimensions.app_start).toBe(6)
        expect(dimensions.page_paint).toBe(7)
        expect(dimensions.page_contentful_paint).toBe(8)
        expect(dimensions.page_content_load).toBe(9)
        expect(dimensions.time_to_interactive).toBe(10)
    })

    test('on performance event, we send view performance metrics', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()

        ee.receive('performance', {
            bundle: 'development',
            timingStart: 1,
            templateDidMount: 2,
            templateAPIEnd: 3
        })

        const mockedData = ee.tracker.sendEvent.mock.calls[0][0]
        const dimensions = mockedData.dimensions

        expect(mockedData.data.action).toBe('performance')
        expect(dimensions.bundle).toBe('development')
        expect(dimensions.timing_start).toBe(1)
        expect(dimensions.page_contentful_paint).toBe(2)
        expect(dimensions.page_content_load).toBe(3)
    })

    test('on apply pay, we can see the events with right actions', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()

        ee.receive('applePayOptionDisplayed')
        ee.receive('applePayButtonDisplayed')
        ee.receive('applePayButtonClicked')

        const mockedCalls = ee.tracker.sendEvent.mock.calls

        expect(mockedCalls[0][0].data.action).toBe('apple pay payment option displayed')
        expect(mockedCalls[1][0].data.action).toBe('apple pay button displayed')
        expect(mockedCalls[2][0].data.action).toBe('apple pay clicked')
    })

    test('on offline mode, we can see the events with right actions', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()
        ee.receive('offlineModeUsed', {
            offlinePageSuccess: 3,
            offlinePageFailed: 1,
            durationOfOffline: 1000
        })

        const mockedCalls = ee.tracker.sendEvent.mock.calls

        expect(mockedCalls[0][0].data.action).toBe('offlineModeUsed')
        expect(mockedCalls[0][0].dimensions.page_success).toBe(3)
        expect(mockedCalls[0][0].dimensions.page_failed).toBe(1)
        expect(mockedCalls[0][0].dimensions.value).toBe(1000)
    })

    test('on offline mode, we can see pageview tagged with right dimenison', () => {
        const {ee} = initEngagementEngine(initOption)

        ee.tracker.sendEvent = jest.fn()
        const mockedCalls = ee.tracker.sendEvent.mock.calls

        ee.receive('pageview', {templateName: 'test', status: 'offline_success'}, appState)
        expect(mockedCalls[0][0].dimensions.status).toBe('offline_success')

        ee.receive('pageview', {templateName: 'test'}, appState)
        expect(mockedCalls[1][0].dimensions.status).toBeUndefined()
    })

    test('on launched from homescreen event, platform is set to "PWA:standalone" ', () => {
        const {tracker, ee} = initEngagementEngine(initOption)
        ee.receive('launchedFromHomeScreen', {
            subject: 'user',
            object: 'button',
            action: 'click',
            name: 'add_to_home:launch'
        })

        expect(tracker.get('platform')).toBe('PWA:standalone')
    })
})
