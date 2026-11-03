/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable no-relative-import-paths/no-relative-import-paths -- SSR modules execute directly in Node. */
import {once} from 'events'
import {topPicks} from './catalog-facts'
import {
    createSearchContexts,
    appendTurn,
    conversationHistory,
    conversationMessages
} from './search-assistant/session-store'
import {expandCatalogFacts, modelProducts} from './search-assistant/catalog'
import {routingMessages, answerMessages, agentHandoffMessage} from './search-assistant/prompts'
import {parseFollowUpPlan} from './search-assistant/plan'
import {followUpSuggestions} from './search-assistant/suggestions'
import {searchPageContext} from '../utils/search-page-context'
import {getSearchSummaryConfig} from '../utils/search-summary-config'
export {parseFollowUpPlan}

export function createSearchAssistant({
    config,
    fetchImpl,
    gateway,
    limiter,
    contexts = createSearchContexts()
}) {
    const remember = (args) => contexts.put(args)

    const followUp = async (req, res) => {
        res.set('Cache-Control', 'no-store, no-transform')
        const authorization = req.headers.authorization || ''
        if (!/^Bearer \S+$/.test(authorization))
            return res.status(401).json({message: 'A shopper session is required.'})
        const {contextId, message} = req.body || {}
        if (
            typeof contextId !== 'string' ||
            typeof message !== 'string' ||
            !message.trim() ||
            message.length > 1200
        )
            return res.status(400).json({message: 'Enter a question about your search.'})
        const entry = contexts.get(contextId, authorization)
        if (!entry)
            return res
                .status(404)
                .json({message: 'This search session has expired. Search again to continue.'})
        const settings = getSearchSummaryConfig(config, entry.parameters.siteId)
        if (!settings.enabled || !settings.followUps)
            return res.status(404).json({message: 'Follow-ups are not enabled for this site.'})
        if (entry.session.busy || !limiter.acquire())
            return res.status(429).json({message: 'Please wait for the current answer.'})
        entry.session.busy = true
        const controller = new AbortController()
        const started = Date.now()
        const timeout = setTimeout(() => controller.abort(), 90000)
        const abort = () => controller.abort()
        req.on('aborted', abort)
        res.on('close', abort)
        let heartbeat
        let stage = 'catalog'
        const send = async (event, data) => {
            if (controller.signal.aborted || res.destroyed) throw new Error('Stream closed')
            if (!res.write(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`))
                await once(res, 'drain', {signal: controller.signal})
        }
        try {
            res.set({'Content-Type': 'text/event-stream; charset=utf-8', 'X-Accel-Buffering': 'no'})
            res.flushHeaders()
            res.write(': ok\n\n')
            heartbeat = setInterval(() => {
                if (!res.destroyed && !res.writableNeedDrain) res.write(': ping\n\n')
            }, 15000)
            await send('status', {message: 'Checking the product details in your results…'})
            await expandCatalogFacts({
                entry,
                authorization,
                signal: controller.signal,
                config,
                fetchImpl
            })
            const coverage = {
                loaded: entry.products.size,
                total: entry.total,
                detailed: entry.detailed || 0,
                complete: entry.products.size >= entry.total
            }
            const catalog = {
                query: entry.parameters.q,
                question: message.trim(),
                currency: entry.parameters.currency,
                coverage,
                products: modelProducts(entry)
            }
            stage = 'planning'
            const history = conversationMessages(entry)
            const planText = await gateway.complete(
                routingMessages(catalog, history),
                controller.signal
            )
            stage = 'plan_validation'
            const plan = parseFollowUpPlan(planText, entry.products)
            if (
                plan.action === 'search' &&
                plan.query.toLowerCase() !== String(entry.parameters.q).toLowerCase()
            ) {
                appendTurn(entry, {
                    question: message.trim(),
                    answer: `Searching for ${plan.query}.`,
                    kind: 'search'
                })
                await send('search', {query: plan.query, session_id: entry.session.id})
                await send('completed', {action: 'search', total_ms: Date.now() - started})
                return
            }
            await send('picks', {products: plan.ids.map((id) => entry.products.get(id)), coverage})
            await send('status', {message: 'Writing your answer…'})
            stage = 'answer'
            let answer = ''
            let deltas = 0
            for await (const text of gateway.stream(
                answerMessages(catalog, plan.ids, history),
                controller.signal,
                768
            )) {
                answer += text
                deltas++
                await send('content_delta', {text})
            }
            appendTurn(entry, {
                question: message.trim(),
                answer,
                picks: plan.ids.map((id) => entry.products.get(id))
            })
            await send('completed', {
                action: 'answer',
                session_id: entry.session.id,
                search_key: entry.searchKey,
                history: conversationHistory(entry),
                suggestions: followUpSuggestions(
                    entry,
                    plan.ids.length ? plan.ids.map((id) => entry.products.get(id)) : topPicks(entry)
                ),
                total_ms: Date.now() - started,
                deltas,
                coverage
            })
        } catch (error) {
            console.warn('Search assistant unavailable', {
                stage,
                status: Number.isInteger(error.status) ? error.status : undefined,
                type: error.name,
                responseChars: Number.isInteger(error.chars) ? error.chars : undefined,
                reason: ['plan_framing', 'plan_object', 'plan_action', 'plan_query'].includes(
                    error.code
                )
                    ? error.code
                    : undefined
            })
            if (!controller.signal.aborted && !res.destroyed)
                await send('error', {
                    code: error.status === 429 ? 'rate_limited' : 'assistant_unavailable',
                    message:
                        'I could not check that right now. Your search results are still available.'
                })
        } finally {
            clearTimeout(timeout)
            clearInterval(heartbeat)
            controller.abort()
            req.off('aborted', abort)
            res.off('close', abort)
            entry.session.busy = false
            limiter.release()
            if (!res.writableEnded) res.end()
        }
    }
    const handoff = (req, res) => {
        res.set('Cache-Control', 'no-store')
        const authorization = req.headers.authorization || ''
        if (!/^Bearer \S+$/.test(authorization))
            return res.status(401).json({message: 'A shopper session is required.'})
        const entry = contexts.get(req.body?.contextId, authorization)
        if (!entry) return res.status(404).json({message: 'Search again to continue.'})
        const settings = getSearchSummaryConfig(config, entry.parameters.siteId)
        if (!settings.enabled || !settings.agentHandoff)
            return res.status(404).json({message: 'Agent handoff is not enabled for this site.'})
        if (entry.session.busy)
            return res
                .status(409)
                .json({message: 'Wait for the current answer before handing over.'})
        const snapshot = {
            session_id: entry.session.id,
            query: entry.parameters.q,
            currency: entry.parameters.currency,
            total: entry.total,
            highlighted_products: topPicks(entry).map(({id, name, price}) => ({id, name, price})),
            conversation: conversationHistory(entry).map(({question, text, query}) => ({
                query,
                question,
                answer: text.slice(0, 1200)
            }))
        }
        res.json({
            handoff_id: `${entry.id}:${entry.session.revision}`,
            query: entry.parameters.q,
            page_context: searchPageContext(entry.parameters.q, entry.parameters.refine),
            message: agentHandoffMessage(snapshot)
        })
    }
    return {
        remember,
        followUp,
        handoff,
        topPicks,
        suggestions: followUpSuggestions,
        appendTurn,
        history: conversationHistory,
        messages: conversationMessages,
        sessionAvailable: (id, authorization) => !!contexts.findSession(id, authorization)
    }
}
