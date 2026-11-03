/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-relative-import-paths/no-relative-import-paths -- SSR modules execute directly in Node. */
import {once} from 'events'

import {buildGatewayUrl, createGatewayClient, readGatewayEvents} from './llm-gateway'

import {overviewPrice} from './catalog-facts'

import {createSearchAssistant} from './search-assistant'
import {getSearchSummaryConfig, hasSearchSummarySite} from '../utils/search-summary-config'
import {overviewMessages} from './search-assistant/prompts'
import {refreshSuggestions} from './search-assistant/suggestions'
export {buildGatewayUrl, readGatewayEvents}

// Ground a bounded overview in the same search results displayed by the storefront.
export function buildGrounding(query, result) {
    return {
        query: query.slice(0, 200),
        currency: result.currency,
        scope: 'Selected highlights, not the full result set. The shopper can browse all matching products in the search results below.',
        products: (result.hits || []).slice(0, 3).map((hit) => {
            return {
                name: String(hit.productName || '').slice(0, 120),
                price: overviewPrice(hit)
            }
        })
    }
}

const allowedParams = new Set([
    'q',
    'limit',
    'offset',
    'sort',
    'refine',
    'expand',
    'perPricebook',
    'allVariationProperties',
    'allImages',
    'siteId',
    'locale',
    'currency'
])

export function buildSearchUrl(config, parameters) {
    if (
        !parameters ||
        typeof parameters.q !== 'string' ||
        !parameters.q.trim() ||
        parameters.q.length > 2000
    ) {
        throw new Error('Invalid query')
    }
    const site = config.app.sites.find((entry) => entry.id === parameters.siteId)
    if (
        !site ||
        !site.l10n.supportedLocales.some((entry) => entry.id === parameters.locale) ||
        !site.l10n.supportedCurrencies.includes(parameters.currency)
    )
        throw new Error('Invalid site context')
    const host = config.ssrParameters.proxyConfigs.find((entry) => entry.path === 'api').host
    const org = config.app.commerceAPI.parameters.organizationId
    const url = new URL(
        `https://${host}/search/shopper-search/v1/organizations/${org}/product-search`
    )
    for (const [key, value] of Object.entries(parameters)) {
        if (!allowedParams.has(key)) throw new Error('Unsupported search parameter')
        const values = Array.isArray(value) ? value : [value]
        if (
            values.length > 20 ||
            values.some(
                (entry) =>
                    !['string', 'number', 'boolean'].includes(typeof entry) ||
                    String(entry).length > 2000
            )
        ) {
            throw new Error('Invalid search parameter')
        }
        if (key === 'expand') url.searchParams.set(key, values.join(','))
        else values.forEach((entry) => url.searchParams.append(key, String(entry)))
    }
    const limit = Number(url.searchParams.get('limit') || 25)
    const offset = Number(url.searchParams.get('offset') || 0)
    if (
        !Number.isInteger(limit) ||
        limit < 1 ||
        limit > 200 ||
        !Number.isInteger(offset) ||
        offset < 0 ||
        offset > 10000
    ) {
        throw new Error('Invalid pagination')
    }
    return url
}

export function createSearchSummaryHandler({config, env = process.env, fetchImpl = fetch}) {
    const gateway = createGatewayClient({env, fetchImpl})
    let active = 0
    const limiter = {
        acquire: () => {
            if (active >= 3) return false
            active++
            return true
        },
        release: () => {
            active--
        }
    }
    const assistant = createSearchAssistant({config, fetchImpl, gateway, limiter})
    const handler = async (req, res) => {
        res.set('Cache-Control', 'no-store, no-transform')
        if (!getSearchSummaryConfig(config, req.body?.parameters?.siteId).enabled)
            return res.status(404).json({message: 'Search assistant is not enabled for this site.'})
        if (!/^Bearer \S+$/.test(req.headers.authorization || ''))
            return res.status(401).json({message: 'A shopper session is required.'})
        let url
        try {
            url = buildSearchUrl(config, req.body?.parameters)
        } catch {
            return res.status(400).json({message: 'Invalid search parameters.'})
        }
        if (
            req.body.sessionId &&
            !assistant.sessionAvailable(req.body.sessionId, req.headers.authorization)
        )
            return res.status(404).json({message: 'This search session expired.'})
        if (!limiter.acquire())
            return res.status(429).json({message: 'Please try again in a moment.'})
        const controller = new AbortController()
        const started = Date.now()
        const timeout = setTimeout(() => controller.abort(), 90000)
        const abort = () => controller.abort()
        res.on('close', abort)
        req.on('aborted', abort)
        let heartbeat
        let sentProducts = false
        let context
        let ownsSession = false
        let stage = 'search'
        const send = async (event, data) => {
            if (controller.signal.aborted || res.destroyed) throw new Error('Stream closed')
            if (!res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)) {
                await once(res, 'drain', {signal: controller.signal})
            }
        }
        try {
            // SCAPI validates the shopper before any paid model request is made.
            const search = await fetchImpl(url, {
                headers: {Authorization: req.headers.authorization},
                redirect: 'error',
                signal: controller.signal
            })
            if (!search.ok) {
                return res
                    .status([401, 403].includes(search.status) ? search.status : 502)
                    .json({message: 'Product search could not be completed.'})
            }
            const result = await search.json()
            const searchMs = Date.now() - started
            context = assistant.remember({
                parameters: req.body.parameters,
                result,
                authorization: req.headers.authorization,
                searchUrl: url,
                sessionId: req.body.sessionId
            })
            if (context.session.busy)
                return res.status(429).json({message: 'Please wait for the current answer.'})
            context.session.busy = true
            ownsSession = true
            res.set({'Content-Type': 'text/event-stream; charset=utf-8', 'X-Accel-Buffering': 'no'})
            res.flushHeaders()
            res.write(': ok\n\n')
            heartbeat = setInterval(() => {
                if (!res.destroyed && !res.writableNeedDrain) res.write(': ping\n\n')
            }, 15000)
            await send('products', {
                result,
                search_ms: searchMs,
                context_id: context.id,
                search_key: context.searchKey,
                session_id: context.session.id,
                history: assistant.history(context),
                suggestions: assistant.suggestions(context),
                picks: assistant.topPicks(context)
            })
            sentProducts = true
            if (!result.hits?.length) {
                await send('completed', {
                    search_ms: searchMs,
                    total_ms: Date.now() - started,
                    deltas: 0,
                    chars: 0
                })
                return
            }
            stage = 'gateway'
            let deltas = 0
            let chars = 0
            let overview = ''
            let firstTokenMs
            for await (const text of gateway.stream(
                overviewMessages(
                    buildGrounding(req.body.parameters.q, {
                        ...result,
                        currency: req.body.parameters.currency
                    }),
                    assistant.messages(context)
                ),
                controller.signal
            )) {
                chars += text.length
                overview += text
                firstTokenMs ??= Date.now() - started
                deltas++
                await send('content_delta', {text})
            }
            assistant.appendTurn(context, {
                question: req.body.parameters.q,
                answer: overview,
                picks: assistant.topPicks(context),
                kind: 'overview'
            })
            const suggestions = getSearchSummaryConfig(config, req.body.parameters.siteId).followUps
                ? await refreshSuggestions(
                      context,
                      gateway,
                      controller.signal,
                      assistant.topPicks(context)
                  )
                : []
            await send('completed', {
                session_id: context.session.id,
                search_key: context.searchKey,
                history: assistant.history(context),
                suggestions,
                search_ms: searchMs,
                first_token_ms: firstTokenMs,
                total_ms: Date.now() - started,
                deltas,
                chars
            })
        } catch (error) {
            // Fixed stage and exception type only; no credentials, query, or upstream bodies.
            const safeReasons = new Set(['Gateway request failed', 'Incomplete Gateway stream'])
            console.warn('Search overview failed', {
                stage,
                type: error.name,
                reason: safeReasons.has(error.message) ? error.message : 'stream_or_transport_error'
            })
            if (!res.destroyed && !controller.signal.aborted) {
                if (sentProducts)
                    await send('error', {
                        code: error.status === 429 ? 'rate_limited' : 'summary_unavailable',
                        message:
                            error.status === 429
                                ? 'AI overview is rate limited. Your products are still shown.'
                                : 'The AI overview is unavailable. Your search results are still available.'
                    })
                else if (!res.headersSent)
                    res.status(502).json({message: 'Product search could not be completed.'})
            }
        } finally {
            clearTimeout(timeout)
            clearInterval(heartbeat)
            controller.abort()
            res.off('close', abort)
            req.off('aborted', abort)
            if (ownsSession) context.session.busy = false
            limiter.release()
            if (!res.writableEnded) res.end()
        }
    }
    handler.followUp = assistant.followUp
    handler.handoff = assistant.handoff
    return handler
}

export function registerSearchSummaryRoute(app, config) {
    if (!hasSearchSummarySite(config)) return
    const handler = createSearchSummaryHandler({config})
    app.post('/api/search-with-summary', handler)
    app.post('/api/search-assistant/follow-up', handler.followUp)
    app.post('/api/search-assistant/handoff', handler.handoff)
}
