/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*global dw*/
/* eslint-disable no-import-assign */
/* eslint-disable react-hooks/rules-of-hooks */
import useActiveData from '@salesforce/retail-react-app/app/hooks/use-active-data'
import {
    mockCategory,
    mockProduct,
    mockSearchResults
} from '@salesforce/retail-react-app/app/hooks/einstein-mock-data'
import * as constants from '@salesforce/retail-react-app/app/constants'
import {DEFAULT_SEARCH_PARAMS} from '@salesforce/retail-react-app/app/constants'

jest.mock('@salesforce/retail-react-app/app/constants', () => {
    const original = jest.requireActual('@salesforce/retail-react-app/app/constants')
    return {
        __esModule: true,
        ...original,
        ACTIVE_DATA_ENABLE: true
    }
})

const activeDataApi = useActiveData()
window.dw = class dw {}
dw.ac = {
    applyContext: jest.fn(),

    _capture: jest.fn(),

    _scheduleDataSubmission: jest.fn(),

    _setSiteCurrency: jest.fn(),

    setDWAnalytics: jest.fn()
}

dw.__dwAnalytics = {
    getTracker: jest.fn()
}

describe('Test active data', () => {
    test('viewProduct captures expected product', async () => {
        constants.ACTIVE_DATA_ENABLE = true
        await activeDataApi.sendViewProduct(mockCategory, mockProduct, 'detail')
        expect(dw.ac.applyContext).toHaveBeenCalledWith({category: mockCategory.id})
        expect(dw.ac._capture).toHaveBeenCalledWith({id: mockProduct.id, type: 'detail'})
        expect(dw.ac._scheduleDataSubmission).toHaveBeenCalledWith()
    })

    test('viewProduct does nothing', async () => {
        constants.ACTIVE_DATA_ENABLE = false
        await activeDataApi.sendViewProduct(mockCategory, mockProduct, 'detail')
        expect(dw.ac.applyContext).toHaveBeenCalledTimes(1)
        expect(dw.ac._capture).toHaveBeenCalledTimes(1)
        expect(dw.ac._scheduleDataSubmission).toHaveBeenCalledTimes(1)
    })

    test('viewSearch applies search context and captures expected data', async () => {
        constants.ACTIVE_DATA_ENABLE = true
        await activeDataApi.sendViewSearch(DEFAULT_SEARCH_PARAMS, mockSearchResults)
        expect(dw.ac.applyContext).toHaveBeenCalledWith({searchData: DEFAULT_SEARCH_PARAMS})
    })

    test('viewSearch does nothing', async () => {
        constants.ACTIVE_DATA_ENABLE = false
        await activeDataApi.sendViewSearch(DEFAULT_SEARCH_PARAMS, mockSearchResults)
        expect(dw.ac.applyContext).toHaveBeenCalledTimes(2)
    })

    test('viewCategory applies category context and captures expected data', async () => {
        constants.ACTIVE_DATA_ENABLE = true
        await activeDataApi.sendViewCategory(DEFAULT_SEARCH_PARAMS, mockCategory, mockSearchResults)
        expect(dw.ac.applyContext).toHaveBeenCalledWith({
            category: mockCategory.id,
            searchData: DEFAULT_SEARCH_PARAMS
        })
        expect(dw.ac._scheduleDataSubmission).toHaveBeenCalledWith()
    })

    test('viewCategory does nothing', async () => {
        constants.ACTIVE_DATA_ENABLE = false
        await activeDataApi.sendViewCategory(DEFAULT_SEARCH_PARAMS, mockCategory, mockSearchResults)
        expect(dw.ac.applyContext).toHaveBeenCalledTimes(3)
        expect(dw.ac._scheduleDataSubmission).toHaveBeenCalledTimes(3)
    })

    test('trackPage sets expected DW analytics', async () => {
        constants.ACTIVE_DATA_ENABLE = true
        await activeDataApi.trackPage('test-site-id', 'en-US', 'USD')
        expect(dw.__dwAnalytics.getTracker).toHaveBeenCalledWith(
            '/mobify/proxy/ocapi/on/demandware.store/Sites-test-site-id-Site/en-US/__Analytics-Start'
        )
    })

    test('trackPage does nothing', async () => {
        constants.ACTIVE_DATA_ENABLE = false
        await activeDataApi.trackPage('test-site-id', 'en-US', 'USD')
        expect(dw.__dwAnalytics.getTracker).toHaveBeenCalledTimes(1)
    })
})
