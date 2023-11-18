/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*global dw*/
import {ACTIVE_DATA_ENABLED} from '@salesforce/retail-react-app/app/constants'

const useActiveData = () => {
    // Returns true when the feature flag is enabled and the tracking scripts have been executed
    // This MUST be called before using the `dw` variable, otherwise a ReferenceError will be thrown
    const canTrack = () => ACTIVE_DATA_ENABLED && typeof dw !== 'undefined'
    return {
        async sendViewProduct(category, product, type) {
            if (!canTrack()) return
            try {
                if (dw.ac) {
                    if (category?.id) {
                        dw.ac.applyContext({category: category.id})
                    }
                    if (product?.id) {
                        dw.ac._capture({id: product.id, type: type})
                    }
                    dw.ac._scheduleDataSubmission?.()
                }
            } catch (err) {
                console.warn('Active Data request failed')
            }
        },
        async sendViewSearch(searchParams, productSearchResult) {
            if (!canTrack()) return
            try {
                if (dw.ac) {
                    dw.ac.applyContext({searchData: searchParams})
                    dw.ac._scheduleDataSubmission?.()
                    productSearchResult.hits.map((productSearchItem) => {
                        dw.ac._capture({id: productSearchItem.productId, type: 'searchhit'})
                    })
                }
            } catch (err) {
                console.warn('Active Data request failed')
            }
        },
        async sendViewCategory(searchParams, category, productSearchResult) {
            if (!canTrack()) return
            try {
                if (dw.ac) {
                    if (category?.id) {
                        dw.ac.applyContext({category: category.id, searchData: searchParams})
                    }
                    dw.ac._scheduleDataSubmission?.()
                    productSearchResult.hits.map((productSearchItem) => {
                        dw.ac._capture({id: productSearchItem.productId, type: 'searchhit'})
                    })
                }
            } catch (err) {
                console.warn('Active Data request failed')
            }
        },
        async trackPage(siteId, localeId, currency) {
            if (!canTrack()) return
            try {
                var activeDataUrl =
                    '/mobify/proxy/ocapi/on/demandware.store/Sites-' +
                    siteId +
                    '-Site/' +
                    localeId +
                    '/__Analytics-Start'
                var dwAnalytics = dw.__dwAnalytics?.getTracker(activeDataUrl)
                if (typeof dw.ac === 'undefined') {
                    dwAnalytics?.trackPageView()
                } else {
                    try {
                        dw.ac._setSiteCurrency?.(currency)
                    } catch (err) {
                        console.warn('Active Data request failed')
                    }
                    dw.ac.setDWAnalytics(dwAnalytics)
                }
            } catch (err) {
                console.warn('Active Data request failed')
            }
        }
    }
}

export default useActiveData
