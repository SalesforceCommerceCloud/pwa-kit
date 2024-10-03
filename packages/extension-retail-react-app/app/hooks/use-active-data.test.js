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

const activeDataApi = useActiveData()

beforeAll(() => {
    window.dw = {
        ac: {
            applyContext: jest.fn(),
            _capture: jest.fn(),
            _scheduleDataSubmission: jest.fn(),
            _setSiteCurrency: jest.fn(),
            setDWAnalytics: jest.fn()
        },
        __dwAnalytics: {
            getTracker: jest.fn()
        }
    }
})

afterAll(() => {
    delete window.dw
})

describe('Test active data', () => {
    let originalValue
    beforeAll(() => (originalValue = constants.ACTIVE_DATA_ENABLED))
    afterAll(() => (constants.ACTIVE_DATA_ENABLED = originalValue))
    beforeEach(() => {
        jest.resetAllMocks()
    })

    test('viewProduct captures expected product', async () => {
        constants.ACTIVE_DATA_ENABLED = true
        await activeDataApi.sendViewProduct(mockCategory, mockProduct, 'detail')
        expect(dw.ac.applyContext).toHaveBeenCalledWith({category: mockCategory.id})
        expect(dw.ac._capture).toHaveBeenCalledWith({id: mockProduct.id, type: 'detail'})
        expect(dw.ac._scheduleDataSubmission).toHaveBeenCalledWith()
    })

    test('viewProduct does nothing', async () => {
        constants.ACTIVE_DATA_ENABLED = false
        await activeDataApi.sendViewProduct(mockCategory, mockProduct, 'detail')
        expect(dw.ac.applyContext).toHaveBeenCalledTimes(0)
        expect(dw.ac._capture).toHaveBeenCalledTimes(0)
        expect(dw.ac._scheduleDataSubmission).toHaveBeenCalledTimes(0)
    })

    test('viewSearch applies search context and captures expected data', async () => {
        constants.ACTIVE_DATA_ENABLED = true
        await activeDataApi.sendViewSearch(DEFAULT_SEARCH_PARAMS, mockSearchResults)
        expect(dw.ac.applyContext).toHaveBeenCalledWith({searchData: DEFAULT_SEARCH_PARAMS})
    })

    test('viewSearch does nothing', async () => {
        constants.ACTIVE_DATA_ENABLED = false
        await activeDataApi.sendViewSearch(DEFAULT_SEARCH_PARAMS, mockSearchResults)
        expect(dw.ac.applyContext).toHaveBeenCalledTimes(0)
    })

    test('viewCategory applies category context and captures expected data', async () => {
        constants.ACTIVE_DATA_ENABLED = true
        await activeDataApi.sendViewCategory(DEFAULT_SEARCH_PARAMS, mockCategory, mockSearchResults)
        expect(dw.ac.applyContext).toHaveBeenCalledWith({
            category: mockCategory.id,
            searchData: DEFAULT_SEARCH_PARAMS
        })
        expect(dw.ac._scheduleDataSubmission).toHaveBeenCalledWith()
    })

    test('viewCategory does nothing', async () => {
        constants.ACTIVE_DATA_ENABLED = false
        await activeDataApi.sendViewCategory(DEFAULT_SEARCH_PARAMS, mockCategory, mockSearchResults)
        expect(dw.ac.applyContext).toHaveBeenCalledTimes(0)
        expect(dw.ac._scheduleDataSubmission).toHaveBeenCalledTimes(0)
    })

    test('trackPage sets expected DW analytics', async () => {
        constants.ACTIVE_DATA_ENABLED = true
        await activeDataApi.trackPage('test-site-id', 'en-US', 'USD')
        expect(dw.__dwAnalytics.getTracker).toHaveBeenCalledWith(
            '/mobify/proxy/ocapi/on/demandware.store/Sites-test-site-id-Site/en-US/__Analytics-Start'
        )
    })

    test('trackPage does nothing', async () => {
        constants.ACTIVE_DATA_ENABLED = false
        await activeDataApi.trackPage('test-site-id', 'en-US', 'USD')
        expect(dw.__dwAnalytics.getTracker).toHaveBeenCalledTimes(0)
    })
})
