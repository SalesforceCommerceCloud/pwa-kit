/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {isRemote} from './utils'
import {createProxyMiddleware, responseInterceptor} from 'http-proxy-middleware'
import logger from '../logger-instance'

import {evaluateRule} from './mrt-rule-matcher'

/**
 * Express middleware that proxies hybrid traffic to an SFCC instance
 *
 * @param {Object} options runtime options
 */
export function hybridProxy(options) {
    var PROXY_OPTIONS = {}
    var HYBRID_ROUTING_RULES = []

    if (!options.localAllowCookies) {
        logger.warn(
            'WARNING: options.localAllowCookies is not set to true. SFCC sessions will not work.'
        )
    }

    // Target SFCC Instance to Proxy Requests to
    // ex. https://abcd-002.dx.commercecloud.salesforce.com
    const SFCC_ORIGIN = options.sfccOrigin
    if (!SFCC_ORIGIN) {
        logger.warn(
            'WARNING: options.sfccOrigin is required to use hybrid proxy. Please set it in your server options.'
        )
    }

    // Ourselves, the pwa-kit application
    const appHostname = options.appHostname
    const protocol = isRemote() ? 'https' : options.protocol
    const PROXY_ORIGIN = `${protocol}://${appHostname}`
    // Gather Hybrid routing rules from options. If the rule is not matched, we will proxy the request to SFCC_ORIGIN.
    HYBRID_ROUTING_RULES = options.hybridRoutingRules
    if (HYBRID_ROUTING_RULES.length === 0) {
        logger.warn(
            'WARNING: No hybridRoutingRules rules found. Please set options.hybridRoutingRules in your server options.'
        )
    }

    PROXY_OPTIONS = {
        target: SFCC_ORIGIN,
        changeOrigin: true,
        // rewrite Location headers
        autoRewrite: true,
        hostRewrite: true,
        cookieDomainRewrite: true,
        selfHandleResponse: true,
        onProxyRes: (proxyRes, req, res) => {
            return responseInterceptor(async (responseBuffer) => {
                const contentType = proxyRes?.headers['content-type']
                if (!contentType) return responseBuffer

                let response
                let updatedResponse

                switch (contentType.split(';')[0]) {
                    case 'text/html':
                        response = responseBuffer.toString('utf8')

                        // some links are absolute URLs, replace them so they go through the proxy
                        updatedResponse = response.replace(
                            new RegExp(`${SFCC_ORIGIN}`, 'g'),
                            PROXY_ORIGIN
                        )

                        // replace any redirects to the SFCC origin with the proxy origin (for example: URLUtils.https)
                        if (
                            proxyRes?.headers?.location &&
                            proxyRes?.headers?.location.includes(SFCC_ORIGIN)
                        ) {
                            logger.info(`Rewriting location header => ${proxyRes.headers.location}`)
                            res.setHeader(
                                'location',
                                proxyRes.headers.location.replace(SFCC_ORIGIN, PROXY_ORIGIN)
                            )
                        }

                        // prefix /on/demandware.static/ with /mobify/proxy/dwrestatic to force
                        // static assets through an MRT proxy; there should be no reason
                        // to process this in runtime code (nor should there be POST requests for these)
                        // requires a unique MRT proxy configure; ignore DIS CDN links that look similar
                        updatedResponse = updatedResponse.replace(
                            new RegExp(`(?<!dw/image/.+?/.+?)/on/demandware\\.static/`, 'g'),
                            `/mobify/proxy/dwrestatic/on/demandware.static/`
                        )
                        return updatedResponse
                    case 'application/json':
                        try {
                            response = JSON.parse(responseBuffer.toString('utf8'))
                            return JSON.stringify(
                                iterate(response, null, {SFCC_ORIGIN, PROXY_ORIGIN})
                            )
                        } catch (e) {
                            logger.error(`error parsing JSON input: ${e}`)
                            return responseBuffer
                        }
                    default:
                        return responseBuffer
                }
            })(proxyRes, req, res)
        }
    }

    // Attach the proxy middleware if we are in hybrid mode
    return createProxyMiddleware(function (pathname, req) {
        let match = HYBRID_ROUTING_RULES.some((rule) =>
            evaluateRule(rule, {
                host: req.hostname,
                uri: req.url,
                path: pathname,
                cookies: req.headers.cookie || ''
            })
        )

        // uncomment to debug
        // logger.debug(`*********** ${pathname} => ${match ? 'MRT' : 'SFCC'}`)

        // HYBRID_ROUTING_RULES(MRT eCDN rules) are evaluated to determine what gets sent to MRT
        // https://developer.salesforce.com/docs/commerce/commerce-api/references/cdn-api-process-apis?meta=createMrtRules
        // So the traffic we proxy to SFCC will be the opposite
        return !match
    }, PROXY_OPTIONS)
}

const isString = (element) => {
    if (!element) return false
    return typeof element === 'string'
}

const isArray = (element) => {
    if (!element) return false
    return Array.isArray(element)
}

const isObject = (element) => {
    if (!element) return false
    return typeof element === 'object'
}
const isIterable = (element) => {
    if (!element) return false
    return isArray(element) || isObject(element)
}

const forEachIn = (iterable, functionRef) => {
    Object.keys(iterable).forEach((key) => {
        functionRef(key, iterable[key])
    })
}

export const iterate = (object, parent, vars = {}) => {
    if (!isIterable(object)) return object
    const {SFCC_ORIGIN, PROXY_ORIGIN} = vars
    forEachIn(object, (key, value) => {
        // replace any urls to the SFCC origin with the proxy origin
        if (
            isString(value) &&
            isString(key) &&
            KEYS_TO_REWRITE.indexOf(String(key).toLowerCase()) > -1
        ) {
            logger.info(`Rewriting JSON value => ${value} for key: ${key}`)
            object[key] = value.replace(SFCC_ORIGIN, PROXY_ORIGIN)
            logger.info(`new value => ${object[key]}`)
        }
        iterate(value, parent, vars)
    })
    return object
}

// use all lowercase keys
const KEYS_TO_REWRITE = ['redirecturl']
