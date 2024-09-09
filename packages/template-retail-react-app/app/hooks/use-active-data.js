/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*global dw*/
import {ACTIVE_DATA_ENABLED} from '@salesforce/retail-react-app/app/constants'
import {proxyBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'

const useActiveData = () => {
    // Returns true when the feature flag is enabled and the tracking scripts have been executed
    // This MUST be called before using the `dw` variable, otherwise a ReferenceError will be thrown
    const canTrack = () => ACTIVE_DATA_ENABLED && typeof dw !== 'undefined'
    return {
        async sendViewProduct(category, product, type) {
            if (!canTrack()) return
            try {
                if (dw?.ac) {
                    if (category && category.id) {
                        dw.ac.applyContext({category: category.id})
                    }
                    if (product && product.id) {
                        dw.ac._capture({id: product.id, type: type})
                    }
                    if (dw.ac?._scheduleDataSubmission) {
                        dw.ac._scheduleDataSubmission()
                    }
                }
            } catch (err) {
                logger.error('ActiveData sendViewProduct error', {
                    namespace: 'useActiveData.sendViewProduct',
                    additionalProperties: {error: err}
                })
            }
        },
        async sendViewSearch(searchParams, productSearchResult) {
            if (!canTrack()) return
            try {
                if (dw?.ac) {
                    dw.ac.applyContext({searchData: searchParams})
                    if (dw.ac?._scheduleDataSubmission) {
                        dw.ac._scheduleDataSubmission()
                    }
                    productSearchResult.hits.map((productSearchItem) => {
                        dw.ac._capture({id: productSearchItem.productId, type: 'searchhit'})
                    })
                }
            } catch (err) {
                logger.error('ActiveData sendViewSearch error', {
                    namespace: 'useActiveData.sendViewSearch',
                    additionalProperties: {error: err}
                })
            }
        },
        async sendViewCategory(searchParams, category, productSearchResult) {
            if (!canTrack()) return
            try {
                if (dw?.ac) {
                    if (category && category.id) {
                        dw.ac.applyContext({category: category.id, searchData: searchParams})
                    }
                    if (dw.ac?._scheduleDataSubmission) {
                        dw.ac._scheduleDataSubmission()
                    }
                    productSearchResult.hits.map((productSearchItem) => {
                        dw.ac._capture({id: productSearchItem.productId, type: 'searchhit'})
                    })
                }
            } catch (err) {
                logger.error('ActiveData sendViewCategory error', {
                    namespace: 'useActiveData.sendViewCategory',
                    additionalProperties: {error: err}
                })
            }
        },
        async trackPage(siteId, localeId, currency) {
            if (!canTrack()) return
            try {
                var activeDataUrl =
                    `${proxyBasePath}/ocapi/on/demandware.store/Sites-` +
                    siteId +
                    '-Site/' +
                    localeId +
                    '/__Analytics-Start'
                var dwAnalytics = dw.__dwAnalytics.getTracker(activeDataUrl)
                if (typeof dw.ac == 'undefined') {
                    dwAnalytics.trackPageView()
                } else {
                    try {
                        if (typeof dw.ac._setSiteCurrency === 'function') {
                            dw.ac._setSiteCurrency(currency)
                        }
                    } catch (err) {
                        logger.error('ActiveData trackPage error', {
                            namespace: 'useActiveData.trackPage',
                            additionalProperties: {error: err}
                        })
                    }
                    dw.ac.setDWAnalytics(dwAnalytics)
                }
            } catch (err) {
                logger.error('ActiveData trackPage error', {
                    namespace: 'useActiveData.trackPage',
                    additionalProperties: {error: err}
                })
            }
        }
    }
}

export default useActiveData
