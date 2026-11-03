/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

const tokenEndpoint = (value) => {
    let url
    try {
        url = new URL(value)
    } catch {
        throw new Error('Invalid ECA token endpoint')
    }
    if (
        url.protocol !== 'https:' ||
        !url.hostname.endsWith('.salesforce.com') ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        url.pathname !== '/services/oauth2/token' ||
        (url.port && url.port !== '443')
    )
        throw new Error('Invalid ECA token endpoint')
    return url
}
const jwtExpiry = (token) => {
    try {
        if (typeof token !== 'string' || token.split('.').length !== 3) return 0
        const claims = JSON.parse(Buffer.from(token.split('.')[1], 'base64url').toString())
        return Number.isFinite(claims.exp) ? claims.exp * 1000 : 0
    } catch {
        return 0
    }
}

// Server-only ECA client-credentials exchange. Decode exp only for caching; Salesforce validates the JWT.
export function createEcaAuth({env, fetchImpl = fetch, now = Date.now}) {
    const endpoint = tokenEndpoint(env.LLM_GATEWAY_ECA_TOKEN_URL)
    if (!env.LLM_GATEWAY_ECA_CLIENT_ID || !env.LLM_GATEWAY_ECA_CLIENT_SECRET)
        throw new Error('Set LLM_GATEWAY_ECA_CLIENT_ID and LLM_GATEWAY_ECA_CLIENT_SECRET')
    let cached = null
    let inFlight = null
    const mint = async () => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)
        try {
            const response = await fetchImpl(endpoint, {
                method: 'POST',
                redirect: 'error',
                signal: controller.signal,
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json'
                },
                body: new URLSearchParams({
                    grant_type: 'client_credentials',
                    client_id: env.LLM_GATEWAY_ECA_CLIENT_ID,
                    client_secret: env.LLM_GATEWAY_ECA_CLIENT_SECRET
                }).toString()
            })
            if (!response.ok) {
                await response.body?.cancel?.().catch(() => {})
                const error = new Error('ECA token exchange failed')
                error.status = response.status
                throw error
            }
            const payload = await response.json()
            const expires = jwtExpiry(payload.access_token)
            if (expires <= now()) throw new Error('ECA must issue an unexpired JWT access token')
            const margin = Math.min(120000, (expires - now()) / 10)
            cached = {token: payload.access_token, refreshAt: expires - margin}
            return cached
        } finally {
            clearTimeout(timeout)
        }
    }
    return {
        refreshable: true,
        async authorize() {
            if (!cached || cached.refreshAt <= now()) {
                if (!inFlight)
                    inFlight = mint().finally(() => {
                        inFlight = null
                    })
                await inFlight
            }
            const lease = cached
            return {
                headers: {
                    Authorization: `Bearer ${lease.token}`,
                    ...(env.LLM_GATEWAY_ECA_TENANT_ID
                        ? {'x-sfdc-core-tenant-id': env.LLM_GATEWAY_ECA_TENANT_ID}
                        : {})
                },
                invalidate() {
                    if (cached?.token === lease.token) cached = null
                }
            }
        }
    }
}

// ECA selects its own public SFAP profile; never inherit an internal API-key destination/model.
export function ecaRequestProfile(env) {
    const origin = env.LLM_GATEWAY_ECA_ORIGIN || 'https://api.salesforce.com'
    if (
        ![
            'https://api.salesforce.com',
            'https://test.api.salesforce.com',
            'https://dev.api.salesforce.com',
            'https://perf.api.salesforce.com'
        ].includes(origin)
    )
        throw new Error('Invalid ECA Gateway origin')
    return {
        endpoint: new URL('/ai/gpt/v1/chat/generations/stream', origin),
        featureId: env.LLM_GATEWAY_ECA_CLIENT_FEATURE || 'ai-platform-models-connected-app',
        body: (messages) => ({
            model: env.LLM_GATEWAY_ECA_MODEL || 'sfdc_ai__DefaultGPT4Omni',
            messages,
            generation_settings: {parameters: {}}
        })
    }
}
