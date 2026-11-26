/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect, useRef} from 'react'
import {useAccessToken} from '@salesforce/commerce-sdk-react'
import {getEnvBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'
import {handoffSearch} from '@salesforce/retail-react-app/app/utils/commerce-agent-search-handoff'

export default function useCommerceAgentSearch(enabled, search, locationKey, autoHandoff) {
    const key = enabled ? JSON.stringify({search, locationKey, autoHandoff}) : null
    const {getTokenWhenReady} = useAccessToken()
    const tokenGetter = useRef(getTokenWhenReady)
    tokenGetter.current = getTokenWhenReady

    useEffect(() => {
        if (!key) return
        const controller = new AbortController()
        const {signal} = controller
        const request = JSON.parse(key)
        const load = async () => {
            const {siteId, query} = request.search
            const endpoint = (getEnvBasePath() || '') + '/api/commerce-agent/classify'
            try {
                const token = await tokenGetter.current()
                if (!token || signal.aborted) return
                const response = await fetch(
                    endpoint + '?' + new URLSearchParams({siteId, query}),
                    {
                        method: 'GET',
                        redirect: 'error',
                        headers: {Authorization: 'Bearer ' + token},
                        signal
                    }
                )
                if (!response.ok) return
                const result = await response.json()
                if (!signal.aborted && result?.type === 'agent' && request.autoHandoff) {
                    await handoffSearch(query, signal)
                }
            } catch {
                // Native product search runs independently of the routing request.
            }
        }
        void load()
        return () => controller.abort()
    }, [key])
}
