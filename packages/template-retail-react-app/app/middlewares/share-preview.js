/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {cookieAsString} from '@salesforce/pwa-kit-runtime/utils/ssr-proxying'
import logger from '@salesforce/pwa-kit-runtime/utils/logger-instance'
import {getAppOrigin} from '@salesforce/pwa-kit-react-sdk/utils/url'

export const PREVIEW_CONTEXT_PARAM = 'previewContext'
// Share-preview marker cookie; site-scoped as cc-sp_<siteId> at set time.
export const SHARE_PREVIEW_COOKIE = 'cc-sp'

function parseCookieValue(req, cookieName) {
    const raw = req.headers?.cookie
        ?.split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith(cookieName + '='))
    return raw ? decodeURIComponent(raw.slice(cookieName.length + 1)) : null
}

export async function sharePreviewMiddleware(req, res, next) {
    if (process.env.DEPLOY_TARGET === 'production') return next()

    const previewToken = req.query?.[PREVIEW_CONTEXT_PARAM]
    if (!previewToken || typeof previewToken !== 'string') return next()

    const appConfig = getConfig()?.app
    const {organizationId, siteId} = appConfig?.commerceAPI?.parameters || {}
    const cookieName = `${SHARE_PREVIEW_COOKIE}_${siteId}`

    if (parseCookieValue(req, cookieName)) return next()

    const shopperToken = parseCookieValue(req, `cc-at_${siteId}`)
    if (!shopperToken) {
        logger.warn('share-preview: no shopper token found, skipping preview context apply')
        return next()
    }

    try {
        let exp
        try {
            const payload = JSON.parse(
                Buffer.from(previewToken.split('.')[1], 'base64url').toString('utf8')
            )
            exp = typeof payload.exp === 'number' ? payload.exp : undefined
        } catch {
            logger.warn('share-preview: malformed token, skipping')
            return next()
        }

        const proxy = `${getAppOrigin()}${appConfig?.commerceAPI?.proxyPath || '/mobify/proxy/api'}`
        const controller = new AbortController()
        const timeout = setTimeout(() => controller.abort(), 5000)
        let response
        try {
            response = await fetch(
                `${proxy}/shopper/shopper-experience/v1/organizations/${encodeURIComponent(
                    organizationId
                )}/preview-context/apply?siteId=${encodeURIComponent(siteId)}`,
                {
                    method: 'POST',
                    headers: {
                        Authorization: `Bearer ${shopperToken}`,
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({token: previewToken}),
                    signal: controller.signal
                }
            )
        } finally {
            clearTimeout(timeout)
        }

        if (!response.ok) {
            logger.warn('share-preview: apply preview context failed', {
                status: response.status
            })
            return next()
        }

        // Not HttpOnly — the client-side useUpdateShopperContext hook reads this cookie
        // via document.cookie to skip its own shopper context update.
        res.append(
            'set-cookie',
            cookieAsString({
                name: cookieName,
                value: '1',
                path: '/',
                secure: true,
                sameSite: 'Lax',
                ...(exp && {expires: new Date(exp * 1000)})
            })
        )

        const url = new URL(req.originalUrl, 'http://localhost')
        url.searchParams.delete(PREVIEW_CONTEXT_PARAM)
        const pathname = url.pathname.replace(/^\/\/+/, '/')
        return res.redirect(302, `${pathname}${url.search}`)
    } catch (error) {
        logger.warn('share-preview: apply preview context error', {message: error.message})
        return next()
    }
}
