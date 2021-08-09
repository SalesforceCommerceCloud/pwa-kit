/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
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
    })

    test('load sandy tracker', () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        connector.tracker = {
            timing: jest.fn()
        }

        expect.assertions(6)
        return connector.load().then(() => {
            expect(connector.sandy).toBeDefined()
            expect(connector.tracker).toBeDefined()
            expect(connector.tracker.slug).toBe('123')
            expect(connector.tracker.dimensions.mobify_adapted).toBe('true')
            expect(connector.tracker.dimensions.referrer).toBe('')
            expect(connector.tracker.dimensions.platform).toEqual('PWA')
        })
    })

    test('throws error if projectSlug not defined', () => {
        expect(() => {
            new EngagementEngineConnector({projectSlug: null})
        }).toThrow()
    })

    test(`track() sends analytics events: 'pageview', 'performance', 'uiInteraction', 'offline', 'addToCart', 'removeFromCart'
        'addToWishlist', 'removeFromWishlist', 'purchase', if data transformed is not null`, () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        return connector.load().then(() => {
            connector.tracker.sendEvent = jest.fn()
            connector.tracker.set = jest.fn()
            connector.transformPageviewData = jest.fn(() => 'transformedData')
            connector.transformPerformanceData = jest.fn(() => 'transformedData')
            connector.transformUIInteractionData = jest.fn(() => 'transformedData')
            connector.transformOfflineData = jest.fn(() => 'transformedData')
            connector.trackPurchaseData = jest.fn(() => 'trackedData')
            connector.transformShoppingListData = jest.fn(() => 'transformData')
            connector.transformApplePayAction = jest.fn(() => 'transformData')
            connector.transformAppError = jest.fn(() => 'transformedData')
            connector.tracker.set.mockClear()

            connector.track(PAGEVIEW, {})
            expect(connector.tracker.set).toHaveBeenCalledTimes(1)
            expect(connector.transformPageviewData).toHaveBeenCalledTimes(1)
            expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
            connector.tracker.sendEvent.mockClear()
            connector.tracker.set.mockClear()

            connector.track(PERFORMANCE, {})
            expect(connector.tracker.set).toHaveBeenCalledTimes(1)
            expect(connector.transformPerformanceData).toHaveBeenCalledTimes(1)
            expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
            connector.tracker.sendEvent.mockClear()
            connector.tracker.set.mockClear()

            connector.track(UIINTERACTION, {})
            expect(connector.tracker.set).toHaveBeenCalledTimes(1)
            expect(connector.transformUIInteractionData).toHaveBeenCalledTimes(1)
            expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
            connector.tracker.sendEvent.mockClear()
            connector.tracker.set.mockClear()

            connector.track(OFFLINE, {})
            expect(connector.tracker.set).toHaveBeenCalledTimes(1)
            expect(connector.transformOfflineData).toHaveBeenCalledTimes(1)
            expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
            connector.tracker.sendEvent.mockClear()
            connector.tracker.set.mockClear()

            connector.transformOfflineData = jest.fn(() => null)
            connector.track(OFFLINE, {})
            expect(connector.tracker.set).toHaveBeenCalledTimes(1)
            expect(connector.transformOfflineData).toHaveBeenCalledTimes(1)
            expect(connector.tracker.sendEvent).not.toHaveBeenCalled()
            connector.tracker.sendEvent.mockClear()
            connector.tracker.set.mockClear()

            connector.track(PURCHASE, {})
            expect(connector.tracker.set).toHaveBeenCalledTimes(1)
            expect(connector.trackPurchaseData).toHaveBeenCalledTimes(1)
            expect(connector.tracker.sendEvent).not.toHaveBeenCalled()
            connector.tracker.sendEvent.mockClear()
            connector.tracker.set.mockClear()

            connector.track(ADDTOCART, {})
            expect(connector.tracker.set).toHaveBeenCalledTimes(1)
            expect(connector.transformShoppingListData).toHaveBeenCalledTimes(1)
            expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
            connector.tracker.sendEvent.mockClear()
            connector.transformShoppingListData.mockClear()
            connector.tracker.set.mockClear()

            connector.track(REMOVEFROMCART, {})
            expect(connector.transformShoppingListData).toHaveBeenCalledTimes(1)
            expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
            connector.tracker.sendEvent.mockClear()
            connector.transformShoppingListData.mockClear()
            connector.tracker.set.mockClear()

            connector.track(ADDTOWISHLIST, {})
            expect(connector.tracker.set).toHaveBeenCalledTimes(1)
            expect(connector.transformShoppingListData).toHaveBeenCalledTimes(1)
            expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
            connector.tracker.sendEvent.mockClear()
            connector.transformShoppingListData.mockClear()
            connector.tracker.set.mockClear()

            connector.track(REMOVEFROMWISHLIST, {})
            expect(connector.tracker.set).toHaveBeenCalledTimes(1)
            expect(connector.transformShoppingListData).toHaveBeenCalledTimes(1)
            expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
            connector.tracker.sendEvent.mockClear()
            connector.transformShoppingListData.mockClear()
            connector.tracker.set.mockClear()

            connector.track(APPLEPAYOPTIONDISPLAYED, {})
            expect(connector.tracker.set).toHaveBeenCalledTimes(1)
            expect(connector.transformApplePayAction).toHaveBeenCalledWith(APPLEPAYOPTIONDISPLAYED)
            expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
            connector.tracker.sendEvent.mockClear()
            connector.transformApplePayAction.mockClear()
            connector.tracker.set.mockClear()

            connector.track(APPLEPAYBUTTONDISPLAYED, {})
            expect(connector.tracker.set).toHaveBeenCalledTimes(1)
            expect(connector.transformApplePayAction).toHaveBeenCalledWith(APPLEPAYBUTTONDISPLAYED)
            expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
            connector.tracker.sendEvent.mockClear()
            connector.transformApplePayAction.mockClear()
            connector.tracker.set.mockClear()

            connector.track(APPLEPAYBUTTONCLICKED, {})
            expect(connector.tracker.set).toHaveBeenCalledTimes(1)
            expect(connector.transformApplePayAction).toHaveBeenCalledWith(APPLEPAYBUTTONCLICKED)
            expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
            connector.tracker.sendEvent.mockClear()
            connector.transformApplePayAction.mockClear()
            connector.tracker.set.mockClear()

            connector.track(ERROR, {})
            expect(connector.tracker.set).toHaveBeenCalledTimes(1)
            expect(connector.transformAppError).toHaveBeenCalledTimes(1)
            expect(connector.tracker.sendEvent).toHaveBeenCalledTimes(1)
            connector.tracker.sendEvent.mockClear()
            connector.tracker.set.mockClear()

            connector.track(LOCALE, {locale: 'ca'})
            expect(connector.tracker.set).toHaveBeenCalledTimes(2)
            expect(connector.tracker.set).toHaveBeenCalledWith('site_locale', 'ca')
            expect(connector.tracker.sendEvent).not.toHaveBeenCalled()
            connector.tracker.sendEvent.mockClear()
            connector.tracker.set.mockClear()
        })
    })

    test(`track() returns tracked data if analytics event is tracked`, () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        connector.tracker = {
            sendEvent: jest.fn(),
            set: jest.fn()
        }

        connector.transformPageviewData = jest.fn(() => 'trackedData')

        return connector.load().then(() => {
            expect(connector.track(PAGEVIEW, {})).toEqual('trackedData')
        })
    })

    test(`track() returns null if analytics event is not tracked`, () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        connector.tracker = {
            set: jest.fn()
        }

        return connector.load().then(() => {
            expect(connector.track('blahEvent', {})).toBeNull()
        })
    })

    test('transformPageviewData() transforms incoming data into sandy payload', () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        return connector.load().then(() => {
            connector.tracker.set = jest.fn()
            expect(connector.transformPageviewData({templateName: 'blah'})).toEqual({
                data: {
                    action: PAGEVIEW,
                    category: 'pageview'
                },
                dimensions: {
                    templateName: 'blah'
                }
            })
        })
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

        connector.tracker = {
            sendEvent: jest.fn()
        }

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

    test('throws error if importing sandy-tracking-pixel-client fails', () => {
        const connector = new EngagementEngineConnector({
            projectSlug: '123'
        })

        jest.mock('sandy-tracking-pixel-client', () => {
            throw new Error()
        })

        return connector.load().catch((err) => {
            expect(err.message).toBeDefined()
        })
    })
})
