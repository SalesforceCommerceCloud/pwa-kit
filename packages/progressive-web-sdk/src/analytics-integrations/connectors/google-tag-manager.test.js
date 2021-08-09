/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2020 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import {GoogleTagManagerConnector} from './google-tag-manager'
import {PAGEVIEW, PURCHASE} from '../types'
import * as Utils from '../utils'

describe('Google Tag Manager Connector', () => {
    beforeEach(() => {
        // Clean all scripts
        ;[...document.getElementsByTagName('script')].forEach((script) => {
            document.body.removeChild(script)
        })

        // Append first script tag
        const el = document.createElement('script')
        document.body.appendChild(el)
    })

    test('initializes with sandy tracker and sets src to gtm library url', () => {
        const connector = new GoogleTagManagerConnector({
            containerId: '123'
        })

        expect(connector.containerId).toBe('123')
        expect(connector.src).toEqual(
            `https://www.googletagmanager.com/gtm.js?id=${connector.containerId}`
        )
    })

    test('throws error if containerId is not defined', () => {
        expect(() => new GoogleTagManagerConnector({containerId: null})).toThrow()
    })

    test('in load(), connector calls the parent class load()', () => {
        const connector = new GoogleTagManagerConnector({
            containerId: '123'
        })

        jest.spyOn(Utils, 'loadScript').mockImplementation(() => Promise.resolve())

        expect.assertions(2)

        return connector.load().then(() => {
            expect(Utils.loadScript).toHaveBeenCalledWith(connector.src)
            expect(window.dataLayer[0]).toEqual(
                expect.objectContaining({
                    'gtm.start': expect.any(Number), // date time
                    event: 'gtm.js'
                })
            )
        })
    })

    test('track() returns tracked data for pageview, purchase, and pushes it to the data layer', () => {
        const connector = new GoogleTagManagerConnector({
            containerId: '123'
        })

        window.dataLayer.push = jest.fn()
        connector.transformPageviewData = jest.fn(() => 'trackedData1')
        expect(connector.track(PAGEVIEW, {a: 'b'})).toEqual('trackedData1')
        expect(connector.transformPageviewData).toHaveBeenCalledWith({a: 'b'})
        expect(window.dataLayer.push).toHaveBeenCalledWith('trackedData1')

        connector.transformPurchaseData = jest.fn(() => 'trackedData2')
        expect(connector.track(PURCHASE, {c: 'd'})).toEqual('trackedData2')
        expect(connector.transformPurchaseData).toHaveBeenCalledWith({c: 'd'})
        expect(window.dataLayer.push).toHaveBeenCalledWith('trackedData2')
    })

    test('track() returns null if no data is tracked', () => {
        const connector = new GoogleTagManagerConnector({
            containerId: '123'
        })

        window.dataLayer.push = jest.fn()
        expect(connector.track('whatever', {a: 'b'})).toBeNull()
        expect(window.dataLayer.push).not.toHaveBeenCalled()
    })

    test('transformPageviewData() returns transformed data for the data layer', () => {
        const connector = new GoogleTagManagerConnector({
            containerId: '123'
        })

        expect(connector.transformPageviewData({a: 'b'})).toEqual({
            event: 'Pageview',
            a: 'b'
        })
    })

    test('transformPurchaseData() returns transformed data for the data layer', () => {
        const connector = new GoogleTagManagerConnector({
            containerId: '123'
        })

        expect(connector.transformPurchaseData({transaction: 'a', products: 'b'})).toEqual({
            event: 'Ecommerce',
            ec: {
                purchase: {
                    actionField: 'a',
                    products: 'b'
                }
            }
        })
    })
})
