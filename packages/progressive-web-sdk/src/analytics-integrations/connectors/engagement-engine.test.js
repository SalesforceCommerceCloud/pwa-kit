/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {EngagementEngineConnector} from './engagement-engine'
import {
    PAGEVIEW,
    OFFLINE,
    UIINTERACTION,
    PERFORMANCE,
    PURCHASE,
    ADDTOCART,
    REMOVEFROMCART,
    ADDTOWISHLIST,
    REMOVEFROMWISHLIST,
    APPLEPAYOPTIONDISPLAYED,
    APPLEPAYBUTTONDISPLAYED,
    APPLEPAYBUTTONCLICKED,
    ERROR,
    LOCALE
} from '../types'

describe('Engagement Engine Connector', () => {
    beforeEach(() => {
        // Clean all scripts
        ;[...document.getElementsByTagName('script')].forEach((script) => {
            document.body.removeChild(script)
        })

        // Append first script tag
        const el = document.createElement('script')
        el.src = `/scripts/first.js`
        document.body.appendChild(el)

        // mock sandy instance
        window.sandy = {
            instance: {
                DEFAULT_TRACKER_NAME: 'test',
                _global: {
                    location: {pathname: '/home', href: '/'},
                    document: {title: 'home', referrer: '/'}
                },
                create: jest.fn(),
                trackers: {
                    test: {
                        set: jest.fn(),
                        dimensions: {platform: 'pwa'},
                        sendEvent: jest.fn()
                    }
                }
            }
        }
    })

    test('initializes with sandy tracker', () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        expect(connector.sandy).toBeDefined()
        expect(connector.sandy.create).toHaveBeenCalled()
        expect(connector.tracker).toBeDefined()
        expect(connector.tracker.dimensions.platform).toEqual('pwa')
        expect(connector.sandy.trackers.test.set).toHaveBeenCalledTimes(1)
        expect(connector.sandy.trackers.test.set.mock.calls[0]).toEqual(['mobify_adapted', true])
    })

    test('if platform is not set on sandy instance, set it to pwa', () => {
        window.sandy.instance.trackers.test.dimensions.platform = undefined
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        expect(connector.sandy.trackers.test.set).toHaveBeenCalledWith('platform', 'PWA')
    })

    test('throws error if projectSlug not defined', () => {
        expect(() => {
            new EngagementEngineConnector({projectSlug: null})
        }).toThrow()
    })

    test('throws error if window.sandy instance does not exist', () => {
        window.sandy = undefined
        expect(() => {
            new EngagementEngineConnector({projectSlug: '123'})
        }).toThrow()
    })

    test('load() resolves an empty promise', () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        jest.spyOn(Promise, 'resolve')

        expect.assertions(1)
        return connector.load().then(() => {
            expect(Promise.resolve).toHaveBeenCalled()
        })
    })

    test(`track() sends analytics events: 'pageview', 'performance', 'uiInteraction', 'offline', 'addToCart', 'removeFromCart'
        'addToWishlist', 'removeFromWishlist', 'purchase', if data transformed is not null`, () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        connector.transformPageviewData = jest.fn(() => 'transformedData')
        connector.transformPerformanceData = jest.fn(() => 'transformedData')
        connector.transformUIInteractionData = jest.fn(() => 'transformedData')
        connector.transformOfflineData = jest.fn(() => 'transformedData')
        connector.trackPurchaseData = jest.fn(() => 'trackedData')
        connector.transformShoppingListData = jest.fn(() => 'transformData')
        connector.transformApplePayAction = jest.fn(() => 'transformData')
        connector.transformAppError = jest.fn(() => 'transformedData')

        connector.track(PAGEVIEW, {})
        expect(connector.sandy.trackers.test.set).toHaveBeenCalledTimes(2)
        expect(window.sandy.instance.trackers.test.set.mock.calls[1]).toEqual([
            {
                page: '/home',
                title: 'home',
                location: '/',
                referrer: '/'
            }
        ])
        expect(connector.transformPageviewData).toHaveBeenCalledTimes(1)
        expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
        connector.tracker.sendEvent.mockClear()
        window.sandy.instance.trackers.test.set.mockClear()

        connector.track(PERFORMANCE, {})
        expect(connector.sandy.trackers.test.set).toHaveBeenCalledTimes(1)
        expect(connector.transformPerformanceData).toHaveBeenCalledTimes(1)
        expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
        connector.tracker.sendEvent.mockClear()
        window.sandy.instance.trackers.test.set.mockClear()

        connector.track(UIINTERACTION, {})
        expect(connector.sandy.trackers.test.set).toHaveBeenCalledTimes(1)
        expect(connector.transformUIInteractionData).toHaveBeenCalledTimes(1)
        expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
        connector.tracker.sendEvent.mockClear()
        window.sandy.instance.trackers.test.set.mockClear()

        connector.track(OFFLINE, {})
        expect(connector.sandy.trackers.test.set).toHaveBeenCalledTimes(1)
        expect(connector.transformOfflineData).toHaveBeenCalledTimes(1)
        expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
        connector.tracker.sendEvent.mockClear()
        window.sandy.instance.trackers.test.set.mockClear()

        connector.transformOfflineData = jest.fn(() => null)
        connector.track(OFFLINE, {})
        expect(connector.sandy.trackers.test.set).toHaveBeenCalledTimes(1)
        expect(connector.transformOfflineData).toHaveBeenCalledTimes(1)
        expect(connector.tracker.sendEvent).not.toHaveBeenCalled()
        connector.tracker.sendEvent.mockClear()
        window.sandy.instance.trackers.test.set.mockClear()

        connector.track(PURCHASE, {})
        expect(connector.sandy.trackers.test.set).toHaveBeenCalledTimes(1)
        expect(connector.trackPurchaseData).toHaveBeenCalledTimes(1)
        expect(connector.tracker.sendEvent).not.toHaveBeenCalled()
        connector.tracker.sendEvent.mockClear()
        window.sandy.instance.trackers.test.set.mockClear()

        connector.track(ADDTOCART, {})
        expect(connector.sandy.trackers.test.set).toHaveBeenCalledTimes(1)
        expect(connector.transformShoppingListData).toHaveBeenCalledTimes(1)
        expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
        connector.tracker.sendEvent.mockClear()
        connector.transformShoppingListData.mockClear()
        window.sandy.instance.trackers.test.set.mockClear()

        connector.track(REMOVEFROMCART, {})
        expect(connector.sandy.trackers.test.set).toHaveBeenCalledTimes(1)
        expect(connector.transformShoppingListData).toHaveBeenCalledTimes(1)
        expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
        connector.tracker.sendEvent.mockClear()
        connector.transformShoppingListData.mockClear()
        window.sandy.instance.trackers.test.set.mockClear()

        connector.track(ADDTOWISHLIST, {})
        expect(connector.sandy.trackers.test.set).toHaveBeenCalledTimes(1)
        expect(connector.transformShoppingListData).toHaveBeenCalledTimes(1)
        expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
        connector.tracker.sendEvent.mockClear()
        connector.transformShoppingListData.mockClear()
        window.sandy.instance.trackers.test.set.mockClear()

        connector.track(REMOVEFROMWISHLIST, {})
        expect(connector.sandy.trackers.test.set).toHaveBeenCalledTimes(1)
        expect(connector.transformShoppingListData).toHaveBeenCalledTimes(1)
        expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
        connector.tracker.sendEvent.mockClear()
        connector.transformShoppingListData.mockClear()
        window.sandy.instance.trackers.test.set.mockClear()

        connector.track(APPLEPAYOPTIONDISPLAYED, {})
        expect(connector.sandy.trackers.test.set).toHaveBeenCalledTimes(1)
        expect(connector.transformApplePayAction).toHaveBeenCalledWith(APPLEPAYOPTIONDISPLAYED)
        expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
        connector.tracker.sendEvent.mockClear()
        connector.transformApplePayAction.mockClear()
        window.sandy.instance.trackers.test.set.mockClear()

        connector.track(APPLEPAYBUTTONDISPLAYED, {})
        expect(connector.sandy.trackers.test.set).toHaveBeenCalledTimes(1)
        expect(connector.transformApplePayAction).toHaveBeenCalledWith(APPLEPAYBUTTONDISPLAYED)
        expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
        connector.tracker.sendEvent.mockClear()
        connector.transformApplePayAction.mockClear()
        window.sandy.instance.trackers.test.set.mockClear()

        connector.track(APPLEPAYBUTTONCLICKED, {})
        expect(connector.sandy.trackers.test.set).toHaveBeenCalledTimes(1)
        expect(connector.transformApplePayAction).toHaveBeenCalledWith(APPLEPAYBUTTONCLICKED)
        expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
        connector.tracker.sendEvent.mockClear()
        connector.transformApplePayAction.mockClear()
        window.sandy.instance.trackers.test.set.mockClear()

        connector.track(ERROR, {})
        expect(connector.sandy.trackers.test.set).toHaveBeenCalledTimes(1)
        expect(connector.transformAppError).toHaveBeenCalledTimes(1)
        expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
        connector.tracker.sendEvent.mockClear()
        window.sandy.instance.trackers.test.set.mockClear()

        connector.track(LOCALE, {locale: 'ca'})
        expect(connector.sandy.trackers.test.set).toHaveBeenCalledTimes(2)
        expect(connector.tracker.set).toHaveBeenCalledWith('site_locale', 'ca')
        expect(connector.tracker.sendEvent).not.toHaveBeenCalled()
        connector.tracker.sendEvent.mockClear()
        window.sandy.instance.trackers.test.set.mockClear()
    })

    test(`track() returns tracked data if analytics event is tracked`, () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        connector.transformPageviewData = jest.fn(() => 'trackedData')
        expect(connector.track(PAGEVIEW, {})).toEqual('trackedData')
    })

    test(`track() returns null if analytics event is not tracked`, () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        expect(connector.track('blahEvent', {})).toBeNull()
    })

    test('transformPageviewData() transforms incoming data into sandy payload', () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        expect(connector.transformPageviewData({templateName: 'blah'})).toEqual({
            data: {
                action: PAGEVIEW,
                category: 'pageview'
            },
            dimensions: {
                templateName: 'blah'
            }
        })

        expect(connector.tracker.set).toHaveBeenCalled()
    })

    test('transformPerformanceData() transforms incoming data into sandy payload', () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        expect(connector.transformPerformanceData({pageLoadTime: 'blah'})).toEqual({
            data: {
                action: PERFORMANCE,
                category: 'timing'
            },
            dimensions: {
                pageLoadTime: 'blah'
            }
        })

        expect(connector.tracker.set).toHaveBeenCalled()
    })
    test('transformUIInteractionData() transforms incoming data into sandy payload', () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        const uiInteractionData = {
            subject: 'a',
            action: 'b',
            object: 'c',
            name: 'd',
            content: 'e'
        }

        expect(connector.transformUIInteractionData(uiInteractionData)).toEqual({
            data: {
                action: 'abc',
                category: 'timing'
            },
            dimensions: {
                container_name: 'd',
                content: 'e'
            }
        })
    })

    test('transformOfflineData() transforms incoming data into sandy payload', () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        expect(connector.transformOfflineData({startTime: '12345'})).toEqual({
            data: {
                action: OFFLINE,
                category: 'timing'
            },
            dimensions: {
                value: '12345'
            }
        })
    })

    test('transformOfflineData() returns null if there is no startTime', () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        expect(connector.transformOfflineData({startTime: null})).toBeNull()
    })

    test('trackPurchaseData() sends an event for each product in the purchase and for the transaction overall ', () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        connector.tracker.sendEvent = jest.fn()

        const purchaseData = {
            transaction: {
                id: '123',
                revenue: '123'
            },
            products: [{id: 'a1', name: 'aaa', brand: 'bbb'}, {id: 'a2', name: 'ccc', brand: 'ddd'}]
        }

        const product1Data = {
            data: {
                action: 'purchase.product',
                category: 'ecommerce'
            },
            dimensions: {
                transaction_id: '123',
                product_id: 'a1',
                name: 'aaa',
                brand: 'bbb'
            }
        }

        const product2Data = {
            data: {
                action: 'purchase.product',
                category: 'ecommerce'
            },
            dimensions: {
                transaction_id: '123',
                product_id: 'a2',
                name: 'ccc',
                brand: 'ddd'
            }
        }

        const transactionData = {
            data: {
                action: 'purchase',
                category: 'ecommerce'
            },
            dimensions: {
                transaction_id: '123',
                revenue: '123'
            }
        }

        expect(connector.trackPurchaseData(purchaseData)).toEqual([
            product1Data,
            product2Data,
            transactionData
        ])
        expect(connector.tracker.sendEvent.mock.calls[0][0]).toEqual(product1Data)
        expect(connector.tracker.sendEvent.mock.calls[1][0]).toEqual(product2Data)
        expect(connector.tracker.sendEvent.mock.calls[2][0]).toEqual(transactionData)
    })

    test('transformShoppingListData() transforms data into sandy payload', () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        const shoppingListData = {
            type: 'cart',
            count: 3,
            subtotal: 123,
            product: {
                id: 'abc',
                name: 'a1',
                category: 'aaa'
            }
        }
        expect(connector.transformShoppingListData(ADDTOCART, shoppingListData)).toEqual({
            data: {
                action: ADDTOCART,
                category: 'timing'
            },
            dimensions: {
                product_id: 'abc',
                product_name: 'a1',
                product_category: 'aaa',
                cart_items: 3,
                value: 123
            }
        })
    })

    test('transformShoppingListData() transforms data into sandy payload', () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        expect(connector.transformApplePayAction(APPLEPAYOPTIONDISPLAYED)).toEqual({
            data: {
                action: 'apple pay payment option displayed',
                category: 'ecommerce'
            },
            dimensions: {}
        })

        expect(connector.transformApplePayAction(APPLEPAYBUTTONDISPLAYED)).toEqual({
            data: {
                action: 'apple pay button displayed',
                category: 'ecommerce'
            },
            dimensions: {}
        })

        expect(connector.transformApplePayAction(APPLEPAYBUTTONCLICKED)).toEqual({
            data: {
                action: 'apple pay clicked',
                category: 'ecommerce'
            },
            dimensions: {}
        })
        expect(() => connector.transformApplePayAction('asdf')).toThrowError(
            'Apple pay action not supported'
        )
    })

    test('transformAppError() transforms data into sandy payload', () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        expect(connector.transformAppError({name: 'abc', content: '123'})).toEqual({
            data: {
                action: `appRecieveError`,
                category: 'timing'
            },
            dimensions: {
                container_name: 'abc',
                content: '123'
            }
        })
    })
})
