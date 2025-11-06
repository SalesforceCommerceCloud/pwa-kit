/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/*global globalThis*/
import {ACTIVE_DATA_ENABLED} from '@salesforce/retail-react-app/app/constants'
import {getEnvBasePath, proxyBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'

/**
 * Only if `ACTIVE_DATA_ENABLED` is true, and only if not already loaded, asynchronously
 * request/load/execute the script required for DW Active Data analytics to operate.
 * @returns {Promise<boolean>}
 */
async function importDwActiveData() {
    if (!ACTIVE_DATA_ENABLED || globalThis.dw?.ac) {
        return ACTIVE_DATA_ENABLED
    }
    if (typeof globalThis.dw !== 'object' || globalThis.dw === null) {
        globalThis.dw = {}
    }

    // Resolve the loading/import promise with `true`, if `globalThis.dw?.ac` is
    // defined after successful loading. Resolve with `false`, if loading fails.
    return import('../assets/js/active-data').then(
        () => typeof globalThis.dw?.ac !== 'undefined',
        () => false
    )
}

function logError(method, error) {
    logger.error(`ActiveData ${method} error'`, {
        namespace: `useActiveData.${method}`,
        additionalProperties: {error}
    })
}

function trackSearchHits(productSearchResult) {
    const ac = globalThis.dw?.ac
    productSearchResult.hits.map(({productId}) =>
        ac?._capture?.({id: productId, type: 'searchhit'})
    )
}

export default function useActiveData() {
    return {
        async sendViewProduct(category, product, type) {
            try {
                const canTrack = await importDwActiveData()
                if (canTrack) {
                    const ac = globalThis.dw?.ac
                    if (category?.id) {
                        ac?.applyContext?.({category: category.id})
                    }
                    if (product?.id) {
                        ac?._capture?.({id: product.id, type: type})
                    }
                    ac?._scheduleDataSubmission?.()
                }
            } catch (err) {
                logError('sendViewProduct', err)
            }
        },
        async sendViewSearch(searchData, productSearchResult) {
            try {
                const canTrack = await importDwActiveData()
                if (canTrack) {
                    const ac = globalThis.dw?.ac
                    ac?.applyContext?.({searchData})
                    trackSearchHits(productSearchResult)
                    ac?._scheduleDataSubmission?.()
                }
            } catch (err) {
                logError('sendViewSearch', err)
            }
        },
        async sendViewCategory(searchData, category, productSearchResult) {
            try {
                const canTrack = await importDwActiveData()
                if (canTrack) {
                    const ac = globalThis.dw?.ac
                    if (category?.id) {
                        ac?.applyContext?.({category: category.id, searchData})
                    }
                    trackSearchHits(productSearchResult)
                    ac?._scheduleDataSubmission?.()
                }
            } catch (err) {
                logError('sendViewCategory', err)
            }
        },
        async trackPage(siteId, localeId, currency) {
            try {
                const canTrack = await importDwActiveData()
                if (canTrack) {
                    const ac = globalThis.dw?.ac
                    if (!ac?._analytics) {
                        ac?.setDWAnalytics?.(
                            globalThis.dw?.__dwAnalytics?.getTracker?.(
                                `${getEnvBasePath()}${proxyBasePath}/ocapi/on/demandware.store/Sites-${siteId}-Site/${localeId}/__Analytics-Start`
                            )
                        )
                    }
                    ac?._setSiteCurrency?.(currency)
                }
            } catch (err) {
                logError('trackPage', err)
            }
        }
    }
}
