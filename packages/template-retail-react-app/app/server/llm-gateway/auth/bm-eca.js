/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// This server-only adapter consumes the ECOM broker contract in docs/BM-ECA-TOKEN-BROKER.md.
// The broker must be deployed separately: this is not a shipped SCAPI endpoint.
const AM_TOKEN_URL = 'https://account.demandware.com/dwsso/oauth2/access_token'
const BROKER_SCOPE = 'sfcc.llm-auth'
const MAX_TOKEN_LENGTH = 32768

export function bmBrokerEndpoint(value) {
    let url
    try {
        url = new URL(value)
    } catch {
        throw new Error('Invalid BM token broker configuration')
    }
    if (
        url.protocol !== 'https:' ||
        !/^[a-z0-9-]+\.api\.commercecloud\.salesforce\.com$/.test(url.hostname) ||
        url.username ||
        url.password ||
        url.search ||
        url.hash ||
        (url.port && url.port !== '443') ||
        !/^\/merchant\/llm-auth\/v1\/organizations\/f_ecom_[A-Za-z0-9_-]+\/access-tokens$/.test(
            url.pathname
        )
    )
        throw new Error('Invalid BM token broker configuration')
    return url
}
const fail = (message, status) => {
    const error = new Error(message)
    if (Number.isInteger(status)) error.status = status
    return error
}
const refreshTime = (expires, now) => expires - Math.min(120000, (expires - now) / 10)
const parseBrokerToken = (payload, now) => {
    try {
        const token = payload.access_token
        if (
            typeof token !== 'string' ||
            token.length > MAX_TOKEN_LENGTH ||
            !/^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(token) ||
            typeof payload.token_type !== 'string' ||
            payload.token_type.toLowerCase() !== 'bearer' ||
            Object.keys(payload).some(
                (key) => !['access_token', 'token_type', 'core_tenant_id'].includes(key)
            )
        )
            throw new Error()
        // Decode metadata only. The authenticated ECOM broker controls issuance; Gateway validates the JWT.
        const [encodedHeader, encodedClaims] = token.split('.')
        const header = JSON.parse(Buffer.from(encodedHeader, 'base64url').toString())
        const claims = JSON.parse(Buffer.from(encodedClaims, 'base64url').toString())
        const expires = claims.exp * 1000
        if (!Number.isSafeInteger(claims.exp) || expires <= now + 5000 || expires > now + 1830000)
            throw new Error()
        const tenant = header.tnk || payload.core_tenant_id
        if (
            tenant != null &&
            (typeof tenant !== 'string' || !/^core\/[A-Za-z0-9-]+\/[A-Za-z0-9]{18}$/.test(tenant))
        )
            throw new Error()
        if (
            header.tnk &&
            payload.core_tenant_id &&
            header.tnk.toLowerCase() !== payload.core_tenant_id.toLowerCase()
        )
            throw new Error()
        return {token, tenant, refreshAt: refreshTime(expires, now)}
    } catch {
        throw new Error('Invalid BM broker token response')
    }
}

export function createBmEcaAuth({env, fetchImpl = fetch, now = Date.now}) {
    const endpoint = bmBrokerEndpoint(env.LLM_GATEWAY_BM_TOKEN_URL)
    const clientId = env.LLM_GATEWAY_BM_AM_CLIENT_ID
    const clientSecret = env.LLM_GATEWAY_BM_AM_CLIENT_SECRET
    if (!clientId || !clientSecret)
        throw new Error('Set LLM_GATEWAY_BM_AM_CLIENT_ID and LLM_GATEWAY_BM_AM_CLIENT_SECRET')
    // AM tenant scope is derived from the fixed broker URL, not shopper request data.
    const organization = endpoint.pathname.split('/')[5]
    const scope = `SALESFORCE_COMMERCE_API:${organization.slice('f_ecom_'.length)} ${BROKER_SCOPE}`
    let amToken = null
    let cached = null
    let inFlight = null

    const post = async (url, options, message) => {
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 10000)
        try {
            const response = await fetchImpl(url, {
                ...options,
                method: 'POST',
                redirect: 'error',
                signal: controller.signal
            })
            if (!response.ok) {
                await response.body?.cancel?.().catch(() => {})
                throw fail(message, response.status)
            }
            return await response.json()
        } catch (error) {
            // Do not propagate raw fetch errors, OAuth descriptions, credentials or response bodies.
            throw fail(message, error?.status)
        } finally {
            clearTimeout(timeout)
        }
    }
    const getAmToken = async () => {
        if (amToken && amToken.refreshAt > now()) return amToken
        const result = await post(
            AM_TOKEN_URL,
            {
                headers: {
                    Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString(
                        'base64'
                    )}`,
                    'Content-Type': 'application/x-www-form-urlencoded',
                    Accept: 'application/json',
                    'Cache-Control': 'no-store'
                },
                body: new URLSearchParams({grant_type: 'client_credentials', scope}).toString()
            },
            'BM broker service authentication failed'
        )
        if (
            typeof result?.access_token !== 'string' ||
            !result.access_token ||
            result.access_token.length > MAX_TOKEN_LENGTH ||
            /\s/.test(result.access_token) ||
            typeof result.token_type !== 'string' ||
            result.token_type.toLowerCase() !== 'bearer' ||
            !Number.isInteger(result.expires_in) ||
            result.expires_in < 10 ||
            result.expires_in > 86400
        )
            throw new Error('Invalid BM service token response')
        amToken = {
            token: result.access_token,
            refreshAt: refreshTime(now() + result.expires_in * 1000, now())
        }
        return amToken
    }
    const mint = async () => {
        for (let attempt = 0; attempt < 2; attempt++) {
            const lease = await getAmToken()
            let payload
            try {
                // No ECA credentials, shopper bearer tokens, prompts or service IDs are sent here.
                // The ECOM endpoint chooses the instance's stored ECA and always mints a fresh token.
                payload = await post(
                    endpoint,
                    {
                        headers: {
                            Authorization: `Bearer ${lease.token}`,
                            Accept: 'application/json',
                            'Cache-Control': 'no-store'
                        }
                    },
                    'BM credential broker request failed'
                )
            } catch (error) {
                if (error.status !== 401 || attempt > 0) throw error
                if (amToken === lease) amToken = null
                continue
            }
            cached = parseBrokerToken(payload, now())
            return
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
                // Shared exchange is not tied to one shopper's abort signal.
                await inFlight
            }
            const lease = cached
            return {
                headers: {
                    Authorization: `Bearer ${lease.token}`,
                    ...(lease.tenant ? {'x-sfdc-core-tenant-id': lease.tenant} : {})
                },
                invalidate() {
                    if (cached === lease) cached = null
                }
            }
        }
    }
}
