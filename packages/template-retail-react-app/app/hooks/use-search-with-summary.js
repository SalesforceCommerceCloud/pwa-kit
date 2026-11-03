/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect, useRef, useState} from 'react'
import {useAccessToken, useProductSearch} from '@salesforce/commerce-sdk-react'
import {
    useSearchSummaryConfig,
    useCommerceAgentConfig
} from '@salesforce/retail-react-app/app/hooks/use-storefront-config'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks/use-currency'
import {readAssistantResponse} from '@salesforce/retail-react-app/app/utils/search-assistant-stream'
import {
    useSearchAssistantSession,
    createClientSearchSession,
    rememberSearchSession
} from '@salesforce/retail-react-app/app/contexts/search-assistant-session'

const initial = {
    data: undefined,
    isLoading: true,
    isFetched: false,
    isRefetching: false,
    summary: '',
    summaryError: null,
    isSummarizing: false,
    summaryTimings: null,
    contextId: null,
    searchKey: null,
    requestKey: null,
    picks: [],
    suggestions: []
}

const streamTimings = ({search_ms, first_token_ms, total_ms, deltas, chars}) => ({
    search_ms,
    first_token_ms,
    total_ms,
    deltas,
    chars
})

// The current overview is rendered above the transcript; never repeat overview cards in it.
const visibleSearchHistory = (history, searchKey) =>
    (history || []).filter(
        (turn) => searchKey && turn.searchKey === searchKey && turn.kind !== 'overview'
    )

// Only keyword search uses the optional PWA controller. Category browsing keeps SCAPI hooks.
export default function useSearchWithSummary(apiOptions, queryOptions, isSearch, onNewSearch) {
    const settings = useSearchSummaryConfig()
    const agent = useCommerceAgentConfig()
    const featureConfig = {
        ...settings,
        agentHandoff:
            settings.agentHandoff &&
            agent.enabled === 'true' &&
            agent.provider === 'commerce-client'
    }
    const enabled = featureConfig.enabled && isSearch
    const normal = useProductSearch(apiOptions, {...queryOptions, enabled: !enabled})
    const {getTokenWhenReady} = useAccessToken()
    const tokenGetter = useRef(getTokenWhenReady)
    tokenGetter.current = getTokenWhenReady
    const {site, locale} = useMultiSite()
    const {currency} = useCurrency()
    const key = JSON.stringify({
        ...apiOptions.parameters,
        siteId: site.id,
        locale: locale.id,
        currency
    })
    const shared = useSearchAssistantSession()
    const localSession = useRef(createClientSearchSession())
    const session = shared?.session || localSession
    const [state, setState] = useState(initial)
    const [followUps, setFollowUps] = useState([])
    const followUpAbort = useRef(null)
    const generation = useRef(0)
    const busy = useRef(false)
    const navigateSearch = useRef(onNewSearch)
    navigateSearch.current = onNewSearch

    useEffect(() => {
        if (!enabled) return
        const controller = new AbortController()
        generation.current++
        followUpAbort.current?.abort()
        busy.current = false
        setFollowUps([])
        session.current.active = null
        let alive = true
        let gotProducts = false
        let terminal = false
        const update = (change) => {
            if (alive) setState((previous) => ({...previous, ...change}))
        }
        setState({...initial, requestKey: key, isSummarizing: false})
        const run = async () => {
            try {
                const token = await tokenGetter.current()
                if (!alive) return
                const searchRequest = () =>
                    fetch('/api/search-with-summary', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            Authorization: `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            parameters: JSON.parse(key),
                            sessionId: session.current.id
                        }),
                        signal: controller.signal
                    })
                let response = await searchRequest()
                if (response.status === 404 && session.current.id) {
                    if (!alive) return
                    rememberSearchSession(session.current, null)
                    session.current.handoffs.clear()
                    response = await searchRequest()
                }
                await readAssistantResponse(response, (event, data) => {
                    if (!alive) return
                    if (event === 'products') {
                        gotProducts = true
                        rememberSearchSession(session.current, data.session_id)
                        session.current.active = {
                            contextId: data.context_id,
                            token,
                            getToken: () => tokenGetter.current(),
                            query: JSON.parse(key).q,
                            busy: !!data.result.hits?.length,
                            revision: data.history?.at(-1)?.id || 'initial'
                        }
                        setFollowUps(visibleSearchHistory(data.history, data.search_key))
                        update({
                            data: data.result,
                            contextId: data.context_id,
                            searchKey: data.search_key,
                            requestKey: key,
                            picks: data.picks || [],
                            suggestions: data.suggestions || [],
                            isLoading: false,
                            isFetched: true,
                            isSummarizing: !!data.result.hits?.length,
                            summaryTimings: {search_ms: data.search_ms}
                        })
                    } else if (event === 'content_delta') {
                        setState((previous) => ({
                            ...previous,
                            summary: previous.summary + data.text
                        }))
                    } else if (event === 'completed') {
                        terminal = true
                        if (session.current.active) {
                            session.current.active.busy = false
                            session.current.active.revision = data.history?.at(-1)?.id || 'initial'
                        }
                        if (data.history)
                            setFollowUps(visibleSearchHistory(data.history, data.search_key))
                        update({
                            isSummarizing: false,
                            summaryTimings: streamTimings(data),
                            suggestions: data.suggestions || []
                        })
                    } else if (event === 'error') {
                        terminal = true
                        if (session.current.active) session.current.active.busy = false
                        update({
                            isSummarizing: false,
                            summaryError:
                                data.code === 'rate_limited'
                                    ? 'AI overview is temporarily rate limited. Your products are still shown.'
                                    : 'AI overview unavailable. Your products are still shown.'
                        })
                    }
                })
                if (!terminal) throw new Error('Stream ended before completion')
            } catch (error) {
                if (!alive || error.name === 'AbortError') return
                if (session.current.active) session.current.active.busy = false
                update({
                    isLoading: false,
                    isFetched: true,
                    isSummarizing: false,
                    summaryError: gotProducts
                        ? 'AI overview interrupted. Your products are still shown.'
                        : 'Search is unavailable. Please try again.'
                })
            }
        }
        run()
        return () => {
            alive = false
            controller.abort()
            followUpAbort.current?.abort()
            session.current.active = null
        }
    }, [enabled, key])

    const askFollowUp = async (message) => {
        const question = message.trim()
        if (
            !enabled ||
            !featureConfig.followUps ||
            state.requestKey !== key ||
            !state.contextId ||
            !question ||
            busy.current
        )
            return
        busy.current = true
        if (session.current.active) session.current.active.busy = true
        const version = generation.current
        const controller = new AbortController()
        followUpAbort.current = controller
        const id = `${Date.now()}-${version}`
        const updateTurn = (change) => {
            if (generation.current !== version || controller.signal.aborted) return
            setFollowUps((previous) =>
                previous.map((turn) => (turn.id === id ? {...turn, ...change} : turn))
            )
        }
        setFollowUps((previous) => [
            ...previous.filter((turn) => turn.searchKey === state.searchKey).slice(-7),
            {
                id,
                question,
                searchKey: state.searchKey,
                contextId: state.contextId,
                text: '',
                status: 'Checking the product details…',
                busy: true,
                picks: []
            }
        ])
        let terminal = false
        try {
            const token = await tokenGetter.current()
            if (controller.signal.aborted) return
            const response = await fetch('/api/search-assistant/follow-up', {
                method: 'POST',
                headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
                body: JSON.stringify({contextId: state.contextId, message: question}),
                signal: controller.signal
            })
            await readAssistantResponse(response, (event, data) => {
                if (generation.current !== version || controller.signal.aborted) return
                if (event === 'status') updateTurn({status: data.message})
                else if (event === 'picks')
                    updateTurn({picks: data.products || [], coverage: data.coverage})
                else if (event === 'content_delta') {
                    setFollowUps((previous) =>
                        previous.map((turn) =>
                            turn.id === id ? {...turn, text: turn.text + data.text} : turn
                        )
                    )
                } else if (event === 'search') {
                    terminal = true
                    updateTurn({busy: false, status: `Searching for “${data.query}”…`})
                    navigateSearch.current?.(data.query, question)
                } else if (event === 'completed') {
                    terminal = true
                    updateTurn({busy: false, status: '', coverage: data.coverage})
                    setState((previous) => ({...previous, suggestions: data.suggestions || []}))
                    if (session.current.active)
                        session.current.active.revision =
                            data.history?.at(-1)?.id || session.current.active.revision
                } else if (event === 'error') {
                    terminal = true
                    updateTurn({
                        busy: false,
                        error: data.message || 'I could not check that right now.'
                    })
                }
            })
            if (!terminal) throw new Error('incomplete_answer')
        } catch (error) {
            if (error.name !== 'AbortError')
                updateTurn({
                    busy: false,
                    error:
                        error.message === 'context_expired'
                            ? 'This search session expired. Search again to continue.'
                            : 'I could not finish that answer. Please try again.'
                })
        } finally {
            if (generation.current === version) {
                busy.current = false
                if (session.current.active) session.current.active.busy = false
            }
        }
    }
    const current = state.requestKey === key ? state : initial
    return enabled
        ? {
              ...current,
              summaryEnabled: true,
              featureConfig,
              summaryCurrency: currency,
              followUps:
                  state.requestKey === key ? visibleSearchHistory(followUps, state.searchKey) : [],
              askFollowUp
          }
        : {...normal, summaryEnabled: false}
}
