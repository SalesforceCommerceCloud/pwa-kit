/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Readable} from 'node:stream'
import {pipeline} from 'node:stream/promises'
import logger from '@salesforce/pwa-kit-runtime/utils/logger-instance'
// SSR resolves this module directly in Node.
// eslint-disable-next-line no-relative-import-paths/no-relative-import-paths
import {TURN_ID} from '../utils/commerce-agent-turn.js'

const PREFIX = '/api/commerce-agent'
const SEARCH_FIELDS = {
    perPricebook: 'true',
    allVariationProperties: 'true',
    allImages: 'true',
    expand: 'promotions,variations,prices,images,page_meta_tags,custom_properties'
}

const getApiOrigin = (value) => {
    try {
        const url = new URL(value)
        if (
            url.protocol === 'https:' &&
            !url.username &&
            !url.password &&
            url.pathname === '/' &&
            !url.search &&
            !url.hash
        ) {
            return url.origin
        }
    } catch {
        return null
    }
    return null
}

export function createCommerceAgentSearch({config, apiOrigin, fetchImpl = fetch}) {
    const origin = getApiOrigin(apiOrigin)
    if (!origin) throw new TypeError('Commerce Agent Search requires an HTTPS API origin')
    const {organizationId, shortCode} = config.app.commerceAPI.parameters
    const scope = '/api/v1/agent/organizations/' + encodeURIComponent(organizationId)

    const forward = (stream) => async (req, res) => {
        res.set('Cache-Control', 'no-store, no-transform')
        const authorization = req.headers.authorization || ''
        if (!/^Bearer \S{1,16000}$/.test(authorization))
            return res.status(401).json({detail: 'A shopper session is required.'})

        const {siteId, query, locale, currency, limit, sort} = stream ? req.query : req.body || {}
        const site = config.app.sites.find((item) => item.id === siteId)
        if (!site) return res.status(400).json({detail: 'Invalid storefront site.'})
        const url = new URL(scope + '/query', origin)
        url.search = new URLSearchParams({siteId, shortCode}).toString()
        if (stream) {
            if (!TURN_ID.test(req.params.turnId || ''))
                return res.status(400).json({detail: 'Invalid search turn.'})
            url.pathname = scope + '/turns/' + req.params.turnId + '/events'
        } else {
            if (
                typeof query !== 'string' ||
                !query.trim() ||
                query.length > 500 ||
                !site.l10n.supportedLocales.some((item) => item.id === locale) ||
                !site.l10n.supportedCurrencies.includes(currency) ||
                !Number.isInteger(limit) ||
                limit < 1 ||
                limit > 200 ||
                typeof sort !== 'string' ||
                sort.length > 64
            )
                return res.status(400).json({detail: 'Invalid search parameters.'})
            for (const [name, value] of Object.entries({
                ...SEARCH_FIELDS,
                locale,
                currency,
                limit,
                sort
            }))
                url.searchParams.set(name, value)
        }

        const controller = new AbortController()
        const abort = () => controller.abort()
        res.once('close', abort)
        const deadline = setTimeout(abort, stream ? 130000 : 25000)
        try {
            const headers = {
                Authorization: authorization,
                Accept: stream ? 'text/event-stream' : 'application/json'
            }
            if (!stream) headers['Content-Type'] = 'application/json'
            const result = await fetchImpl(url, {
                method: stream ? 'GET' : 'POST',
                headers,
                redirect: 'error',
                body: stream ? undefined : JSON.stringify({query}),
                signal: controller.signal
            })
            if (!result.ok) {
                await result.body?.cancel()
                return res.status(result.status).json({detail: 'Commerce Agent request failed.'})
            }
            if (!stream) return res.json(await result.json())
            if (
                !result.body ||
                !result.headers.get('content-type')?.includes('text/event-stream')
            ) {
                await result.body?.cancel()
                return res.status(502).json({detail: 'Commerce Agent returned an invalid stream.'})
            }
            res.set({'Content-Type': 'text/event-stream; charset=utf-8', 'X-Accel-Buffering': 'no'})
            res.flushHeaders()
            await pipeline(Readable.fromWeb(result.body), res, {signal: controller.signal})
        } catch {
            if (!res.headersSent && !res.destroyed)
                res.status(502).json({detail: 'Commerce Agent is unavailable.'})
            else if (!res.destroyed) res.end()
        } finally {
            clearTimeout(deadline)
            res.removeListener('close', abort)
        }
    }
    return {query: forward(false), events: forward(true)}
}

export function registerCommerceAgentSearch(app, config, apiOrigin) {
    if (!config.app.commerceAgentSearch?.enabled) return
    if (!getApiOrigin(apiOrigin)) {
        logger.warn('Commerce Agent Search requires a valid COMMERCE_AGENT_SEARCH_API_ORIGIN.', {
            namespace: 'CommerceAgentSearch'
        })
        return
    }
    const handlers = createCommerceAgentSearch({config, apiOrigin})
    app.post(PREFIX + '/query', handlers.query)
    app.get(PREFIX + '/turns/:turnId/events', handlers.events)
}
