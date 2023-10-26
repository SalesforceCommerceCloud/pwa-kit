/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ACTIVE_DATA_ENABLE} from '@salesforce/retail-react-app/app/constants'

const useActiveData = () => {
    return {
        async sendViewProduct(category, product, type) {
            if (!ACTIVE_DATA_ENABLE) {
                return
            }
            try {
                if (dw.ac) {
                    if (category && category.id) {
                        console.log('Applying category context')
                        dw.ac.applyContext({category: category.id})
                    }
                    if (product && product.id) {
                        console.log('Capturing product')
                        dw.ac._capture({id: product.id, type: type})
                    }
                }
                if (typeof dw.ac._scheduleDataSubmission === 'function') {
                    dw.ac._scheduleDataSubmission()
                }
            } catch (err) {
                console.error(err)
            }
        },
        async sendViewSearch(searchParams, productSearchResult) {
            if (!ACTIVE_DATA_ENABLE) {
                return
            }
            try {
                console.log('Setting DW Search Context')
                if (dw.ac) {
                    console.log('Applying search context')
                    dw.ac.applyContext({searchData: searchParams})
                    if (typeof dw.ac._scheduleDataSubmission === 'function') {
                        dw.ac._scheduleDataSubmission()
                    }
                    productSearchResult.hits.map((productSearchItem) => {
                        dw.ac._capture({id: productSearchItem.productId, type: 'searchhit'})
                    })
                }
            } catch (err) {
                console.error(err)
            }
        },
        async sendViewCategory(searchParams, category, productSearchResult) {
            if (!ACTIVE_DATA_ENABLE) {
                return
            }
            try {
                console.log('Set DW Category Context')
                if (dw.ac) {
                    if (category && category.id) {
                        console.log('Applying category context')
                        dw.ac.applyContext({category: category.id, searchData: searchParams})
                    }
                    if (typeof dw.ac._scheduleDataSubmission === 'function') {
                        dw.ac._scheduleDataSubmission()
                    }
                    productSearchResult.hits.map((productSearchItem) => {
                        dw.ac._capture({id: productSearchItem.productId, type: 'searchhit'})
                    })
                }
            } catch (err) {
                console.error(err)
            }
        },
        async trackPage(siteId, localeId, currency) {
            if (!ACTIVE_DATA_ENABLE) {
                return
            }
            try {
                var activeDataUrl =
                    '/mobify/proxy/ocapi/on/demandware.store/Sites-' +
                    siteId +
                    '-Site/' +
                    localeId +
                    '/__Analytics-Start'
                console.log('Tracking enabled for ' + activeDataUrl)
                var dwAnalytics = dw.__dwAnalytics.getTracker(activeDataUrl)
                if (typeof dw.ac == 'undefined') {
                    console.log('Tracking page view')
                    dwAnalytics.trackPageView()
                } else {
                    try {
                        if (typeof dw.ac._setSiteCurrency === 'function') {
                            dw.ac._setSiteCurrency(currency)
                        }
                    } catch (err) {
                        console.error(err)
                    }
                    console.log('Setting DW Analytics')
                    dw.ac.setDWAnalytics(dwAnalytics)
                }
            } catch (err) {
                console.error(err)
            }
        }
    }
}

export default useActiveData
