/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import logger from '@salesforce/pwa-kit-runtime/utils/logger-instance'

const CLASSIFY_PATH = '/api/commerce-agent/classify'

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
    const path = '/api/v1/agent/organizations/' + encodeURIComponent(organizationId) + '/classify'

    return async (req, res) => {
        res.set('Cache-Control', 'no-store')
        const authorization = req.headers.authorization || ''
        if (!/^Bearer \S{1,16000}$/.test(authorization))
            return res.status(401).json({detail: 'A shopper session is required.'})

        const {siteId, query} = req.query
        if (!config.app.sites.some((site) => site.id === siteId))
            return res.status(400).json({detail: 'Invalid storefront site.'})
        if (typeof query !== 'string' || !query.trim() || query.length > 500)
            return res.status(400).json({detail: 'Invalid search query.'})
        const url = new URL(path, origin)
        url.search = new URLSearchParams({siteId, shortCode, query}).toString()

        const controller = new AbortController()
        const abort = () => controller.abort()
        res.once('close', abort)
        const deadline = setTimeout(abort, 15000)
        try {
            const result = await fetchImpl(url, {
                method: 'GET',
                headers: {Authorization: authorization, Accept: 'application/json'},
                redirect: 'error',
                signal: controller.signal
            })
            if (!result.ok) {
                await result.body?.cancel()
                return res.status(result.status).json({detail: 'Commerce Agent request failed.'})
            }
            const verdict = await result.json()
            if (verdict?.type !== 'search' && verdict?.type !== 'agent')
                return res.status(502).json({detail: 'Commerce Agent returned an invalid verdict.'})
            return res.json({type: verdict.type})
        } catch {
            if (!res.destroyed) res.status(502).json({detail: 'Commerce Agent is unavailable.'})
        } finally {
            clearTimeout(deadline)
            res.removeListener('close', abort)
        }
    }
}

export function registerCommerceAgentSearch(app, config, apiOrigin) {
    if (!config.app.commerceAgentSearch?.enabled) return
    if (!getApiOrigin(apiOrigin)) {
        logger.warn('Commerce Agent Search requires a valid COMMERCE_AGENT_SEARCH_API_ORIGIN.', {
            namespace: 'CommerceAgentSearch'
        })
        return
    }
    app.get(CLASSIFY_PATH, createCommerceAgentSearch({config, apiOrigin}))
}
