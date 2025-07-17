/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
/*
 * This component is used to set the cache headers for the page.
 */
export default function PageCache() {
    const {res} = useServerContext()
    const {maxCacheAge: MAX_CACHE_AGE, staleWhileRevalidate: STALE_WHILE_REVALIDATE} = getConfig()
    if (res) {
        res.set(
            'Cache-Control',
            `s-maxage=${MAX_CACHE_AGE}, stale-while-revalidate=${STALE_WHILE_REVALIDATE}`
        )
    }
}
