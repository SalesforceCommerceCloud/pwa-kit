/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect, useRef, useState, useCallback} from 'react'
import {useAccessToken} from '@salesforce/commerce-sdk-react'
import {getEnvBasePath} from '@salesforce/pwa-kit-runtime/utils/ssr-namespace-paths'
import {readOverview, TURN_ID} from '@salesforce/retail-react-app/app/utils/commerce-agent-turn'
import {handoffSearch} from '@salesforce/retail-react-app/app/utils/commerce-agent-search-handoff'
import {openShopperAgentWidget} from '@salesforce/retail-react-app/app/utils/shopper-agent-utils'

const overviewError = 'The AI overview could not be completed.'

export default function useCommerceAgentSearch(enabled, search, locationKey, autoHandoff) {
    const key = enabled ? JSON.stringify({search, locationKey, autoHandoff}) : null
    const {getTokenWhenReady} = useAccessToken()
    const tokenGetter = useRef(getTokenWhenReady)
    tokenGetter.current = getTokenWhenReady
    const active = useRef(null)
    const [state, setState] = useState(null)

    const openAgent = useCallback(
        async (question, results) => {
            const request = active.current
            if (!key || request?.key !== key || request.signal.aborted) return
            const {
                search: {query}
            } = JSON.parse(key)
            const message =
                typeof question === 'string' && question.trim() ? question.trim() : query
            if (request.sent.has(message)) return openShopperAgentWidget()
            request.sent.add(message)
            const setHandoffError = (handoffError) =>
                setState((current) => (current?.key === key ? {...current, handoffError} : current))
            setHandoffError(false)
            try {
                await handoffSearch(query, request.signal, {question: message, results})
            } catch {
                request.sent.delete(message)
                if (!request.signal.aborted) setHandoffError(true)
            }
        },
        [key]
    )

    useEffect(() => {
        if (!key) return
        const controller = new AbortController()
        const {signal} = controller
        active.current = {key, signal, sent: new Set()}
        setState({key})
        const request = JSON.parse(key)
        const update = (change) => {
            if (!signal.aborted)
                setState((previous) =>
                    previous?.key === key ? {...previous, ...change} : previous
                )
        }
        const load = async () => {
            const {siteId} = request.search
            const base = (getEnvBasePath() || '') + '/api/commerce-agent'
            let overviewStarted = false
            try {
                const token = await tokenGetter.current()
                if (signal.aborted) return
                if (!token) throw new Error('Missing shopper session')
                const authorization = 'Bearer ' + token
                const response = await fetch(base + '/query', {
                    method: 'POST',
                    redirect: 'error',
                    headers: {'Content-Type': 'application/json', Authorization: authorization},
                    body: JSON.stringify(request.search),
                    signal
                })
                if (!response.ok) throw new Error('Commerce Agent query failed')
                const result = await response.json()
                if (signal.aborted) return
                if (result?.route === 'agent') {
                    update({agentRouted: true})
                    if (request.autoHandoff) void openAgent()
                    return
                }
                if (result?.route !== 'search' || result.nextStep?.type !== 'stream') return
                const {turnId} = result.nextStep
                if (typeof turnId !== 'string' || !TURN_ID.test(turnId)) return
                overviewStarted = true
                update({hasOverview: true, streaming: true, text: ''})
                const events = await fetch(
                    base + '/turns/' + turnId + '/events?' + new URLSearchParams({siteId}),
                    {
                        headers: {Authorization: authorization, Accept: 'text/event-stream'},
                        signal,
                        redirect: 'error'
                    }
                )
                let text = ''
                await readOverview(events, turnId, (delta) => {
                    text += delta
                    update({text})
                })
                update({streaming: false})
            } catch {
                if (overviewStarted) update({streaming: false, error: overviewError})
            }
        }
        void load()
        return () => controller.abort()
    }, [key, openAgent])

    return {...(key && state?.key === key ? state : {}), openAgent}
}
