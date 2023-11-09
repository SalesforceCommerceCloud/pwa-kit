/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useActiveData from '@salesforce/retail-react-app/app/hooks/use-active-data'
import {
    mockCategory,
    mockProduct,
    mockSearchResults
} from '@salesforce/retail-react-app/app/hooks/einstein-mock-data'
import {DEFAULT_SEARCH_PARAMS} from '@salesforce/retail-react-app/app/constants'

let activeDataEnable = true
jest.mock('@salesforce/retail-react-app/app/constants', () => {
    const {default: mockConstants} = jest.requireActual(
        '@salesforce/retail-react-app/app/constants'
    )
    return {
        __esModule: true,
        ...mockConstants,
        ACTIVE_DATA_ENABLE: activeDataEnable
    }
})
const activeDataApi = useActiveData()
window.dw = class dw {}
dw.ac = {
    applyContext(context) {
        console.log('applied context')
    },

    _capture(configs) {
        console.log('captured')
    },

    _scheduleDataSubmission() {
        console.log('scheduled data submission')
    },

    trackPageView() {
        console.log('tracking page view')
    },

    _setSiteCurrency(currency) {
        console.log('set currency')
    },

    setDWAnalytics(analytics) {
        console.log('set dw analytics')
    }
}

dw.__dwAnalytics = {
    getTracker() {
        console.log('got tracker')
    }
}

describe('Test active data', () => {
    test('viewProduct captures expected product', async () => {
        await activeDataApi.sendViewProduct(mockCategory, mockProduct, 'detail')
    })

    test('viewSearch applies search context and captures expected data', async () => {
        await activeDataApi.sendViewSearch(DEFAULT_SEARCH_PARAMS, mockSearchResults)
    })

    test('viewCategory applies category context and captures expected data', async () => {
        await activeDataApi.sendViewCategory(DEFAULT_SEARCH_PARAMS, mockCategory, mockSearchResults)
    })

    test('trackPage sets expected DW analytics', async () => {
        await activeDataApi.trackPage('test-site-id', 'en-US', 'USD')
    })
})
