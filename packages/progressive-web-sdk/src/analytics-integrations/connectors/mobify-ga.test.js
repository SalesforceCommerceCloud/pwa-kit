/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {MobifyGoogleAnalyticsConnector} from './mobify-ga'
import {GoogleAnalyticsConnector} from './google-analytics'
import {PAGEVIEW} from '../types'
import {ADDTOCART, REMOVEFROMCART} from '../../../dist/analytics-integrations/types'

describe('Mobify Google Analytics Connector', () => {
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

    test('initializes with default trackerName, trackerId, and ecommerceLibrary', () => {
        const connector = new MobifyGoogleAnalyticsConnector({
            trackerId: 111,
            ecommerceLibrary: 'ec'
        })

        expect(connector.trackerName).toBe('mobifyTracker')
        expect(connector.trackerId).toBe(111)
        expect(connector.ecommerceLibrary).toBe('ec')
    })

    test('initializes with customized trackerName, trackerId, and ecommerceLibrary', () => {
        const connector = new MobifyGoogleAnalyticsConnector({
            trackerName: 'custom',
            trackerId: 111,
            ecommerceLibrary: 'ec'
        })

        expect(connector.trackerName).toBe('custom')
        expect(connector.trackerId).toBe(111)
        expect(connector.ecommerceLibrary).toBe('ec')
    })

    test('load() calls Google Analytics load() and sets dimension 1', () => {
        const connector = new MobifyGoogleAnalyticsConnector({
            trackerId: 111,
            ecommerceLibrary: 'ec'
        })

        GoogleAnalyticsConnector.prototype.load = jest.fn(() => {
            connector.tracker = {
                set: jest.fn()
            }
            return Promise.resolve()
        })

        expect.assertions(2)

        return connector.load().then(() => {
            expect(GoogleAnalyticsConnector.prototype.load).toHaveBeenCalledTimes(1)
            expect(connector.tracker.set).toHaveBeenCalledWith(`dimension1`, '1')
        })
    })

    test(`track returns tracked data`, () => {
        const connector = new MobifyGoogleAnalyticsConnector({
            trackerId: 111,
            ecommerceLibrary: 'ec'
        })

        connector.trackPageview = jest.fn(() => 'trackedData')
        expect(connector.track('pageview')).toEqual('trackedData')
    })

    test(`track returns null if analytics event type not handled`, () => {
        const connector = new MobifyGoogleAnalyticsConnector({
            trackerId: 111,
            ecommerceLibrary: 'ec'
        })

        connector.trackPageview = jest.fn(() => null)
        expect(connector.track('blahEvent')).toBeNull()
    })

    test(`track handles analytics event: 'pageview', 'addToCart', 'removeFromCart'`, () => {
        const connector = new MobifyGoogleAnalyticsConnector({
            trackerId: 111,
            ecommerceLibrary: 'ec'
        })

        connector.trackPageview = jest.fn()
        connector.track(PAGEVIEW, {})
        expect(connector.trackPageview).toHaveBeenCalled()

        connector.trackCart = jest.fn()
        connector.track(ADDTOCART, {})
        expect(connector.trackCart).toHaveBeenCalledWith(ADDTOCART, {})

        connector.track(REMOVEFROMCART, {})
        expect(connector.trackCart).toHaveBeenCalledWith(REMOVEFROMCART, {})
    })

    test('trackPageview() sets dimension 2, then sends the analytics the same way as the Google Analytics Connector', () => {
        const connector = new MobifyGoogleAnalyticsConnector({
            trackerId: 111,
            ecommerceLibrary: 'ec'
        })

        connector.tracker = {
            set: jest.fn()
        }

        GoogleAnalyticsConnector.prototype.trackPageview = jest.fn()

        connector.trackPageview({templateName: 'blah'})
        expect(connector.tracker.set).toHaveBeenCalledWith(`dimension2`, 'blah')
        expect(GoogleAnalyticsConnector.prototype.trackPageview).toHaveBeenCalled()
    })

    test(`trackCart() for 'addToCart' only tracks event for ecommerce library 'ec'`, () => {
        const connector = new MobifyGoogleAnalyticsConnector({
            trackerId: 111,
            ecommerceLibrary: 'ec'
        })

        const shoppingList = {
            type: 'cart',
            count: 2,
            product: {id: 'a1', name: 'aaa', brand: 'bbb'}
        }

        connector.ga = jest.fn()
        connector.tracker = {
            send: jest.fn()
        }

        expect(connector.trackCart(ADDTOCART, shoppingList)).toEqual([
            [`${connector.trackerName}.ec:addProduct`, shoppingList.product],
            [`${connector.trackerName}.ec:setAction`, 'add'],
            ['event', 'UX', 'click', 'add to cart']
        ])
        expect(connector.ga.mock.calls[0]).toEqual([
            `${connector.trackerName}.ec:addProduct`,
            shoppingList.product
        ])
        expect(connector.ga.mock.calls[1]).toEqual([`${connector.trackerName}.ec:setAction`, 'add'])
        expect(connector.tracker.send.mock.calls[0]).toEqual([
            'event',
            'UX',
            'click',
            'add to cart'
        ])
        const connectorNoEC = new MobifyGoogleAnalyticsConnector({
            trackerId: 111,
            ecommerceLibrary: 'ecommerce'
        })

        connectorNoEC.ga = jest.fn()

        expect(connectorNoEC.trackCart(ADDTOCART, shoppingList)).toBeNull()
    })

    test(`trackCart() for 'removeFromCart' only tracks event for ecommerce library 'ec'`, () => {
        const connector = new MobifyGoogleAnalyticsConnector({
            trackerId: 111,
            ecommerceLibrary: 'ec'
        })

        const shoppingList = {
            type: 'cart',
            count: 2,
            product: {id: 'a1', name: 'aaa', brand: 'bbb'}
        }

        connector.ga = jest.fn()
        connector.tracker = {
            send: jest.fn()
        }
        expect(connector.trackCart(REMOVEFROMCART, shoppingList)).toEqual([
            [`${connector.trackerName}.ec:addProduct`, shoppingList.product],
            [`${connector.trackerName}.ec:setAction`, 'remove'],
            ['event', 'UX', 'click', 'remove from cart']
        ])
        expect(connector.ga.mock.calls[0]).toEqual([
            `${connector.trackerName}.ec:addProduct`,
            shoppingList.product
        ])
        expect(connector.ga.mock.calls[1]).toEqual([
            `${connector.trackerName}.ec:setAction`,
            'remove'
        ])
        expect(connector.tracker.send.mock.calls[0]).toEqual([
            'event',
            'UX',
            'click',
            'remove from cart'
        ])

        const connectorNoEC = new MobifyGoogleAnalyticsConnector({
            trackerId: 111,
            ecommerceLibrary: 'ecommerce'
        })

        connectorNoEC.ga = jest.fn()

        expect(connectorNoEC.trackCart(REMOVEFROMCART, shoppingList)).toBeNull()
    })
})
