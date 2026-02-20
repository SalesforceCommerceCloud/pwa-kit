/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {isRemote, isString, isIterable, forEachIn} from './utils'
import {createProxyMiddleware, responseInterceptor} from 'http-proxy-middleware'
import logger from '../logger-instance'

import {evaluateRule} from './mrt-rule-matcher'

/**
 * Express middleware that proxies hybrid traffic to an SFCC instance
 *
 * @param {Object} options runtime options
 */
export function hybridProxy(options) {
    var proxyOptions = {}
    var hybridRoutingRules = []

    if (!options.localAllowCookies) {
        logger.warn(
            'WARNING: options.localAllowCookies is not set to true. SFCC sessions will not work.'
        )
    }

    // Target SFCC Instance to Proxy Requests to
    // ex. https://abcd-002.dx.commercecloud.salesforce.com
    const sfccOrigin = options.hybridProxy?.sfccOrigin
    if (!sfccOrigin) {
        logger.warn(
            'WARNING: options.hybridProxy.sfccOrigin is required to use hybrid proxy. Please set it in your server options.'
        )
    }

    // Ourselves, the pwa-kit application
    const appHostname = options.appHostname
    const protocol = isRemote() ? 'https' : options.protocol
    const proxyOrigin = `${protocol}://${appHostname}`
    // Gather Hybrid routing rules from options. If the rule is not matched, we will proxy the request to sfccOrigin.
    hybridRoutingRules = options.hybridProxy?.routingRules || []
    if (hybridRoutingRules.length === 0) {
        logger.warn(
            'WARNING: No hybridProxy.routingRules found. Please set options.hybridProxy.routingRules in your server options.'
        )
    }

    proxyOptions = {
        target: sfccOrigin,
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
                            new RegExp(`${sfccOrigin}`, 'g'),
                            proxyOrigin
                        )

                        // replace any redirects to the SFCC origin with the proxy origin
                        if (
                            proxyRes?.headers?.location &&
                            proxyRes?.headers?.location.includes(sfccOrigin)
                        ) {
                            logger.info(`Rewriting location header => ${proxyRes.headers.location}`)
                            res.setHeader(
                                'location',
                                proxyRes.headers.location.replace(sfccOrigin, proxyOrigin)
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
                                iterate(response, null, {sfccOrigin, proxyOrigin})
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
        let match = hybridRoutingRules.some((rule) =>
            evaluateRule(rule, {
                host: req.hostname,
                uri: req.url,
                path: pathname,
                cookies: req.headers.cookie || ''
            })
        )

        // hybridRoutingRules(MRT eCDN rules) are evaluated to determine what gets sent to MRT
        // https://developer.salesforce.com/docs/commerce/commerce-api/references/cdn-api-process-apis?meta=createMrtRules
        // So the traffic we proxy to SFCC will be the opposite
        return !match
    }, proxyOptions)
}

/**
 * This key is used to identify JSON properties that contain URLs
 * that need to be rewritten from SFCC origin to proxy origin.
 */
const KEY_TO_REWRITE = 'redirecturl'

export const iterate = (object, parent, vars = {}) => {
    if (!isIterable(object)) return object
    const {sfccOrigin, proxyOrigin} = vars
    forEachIn(object, (key, value) => {
        // replace any urls to the SFCC origin with the proxy origin
        if (isString(value) && isString(key) && String(key).toLowerCase() === KEY_TO_REWRITE) {
            logger.info(`Rewriting JSON value => ${value} for key: ${key}`)
            object[key] = value.replace(sfccOrigin, proxyOrigin)
            logger.info(`new value => ${object[key]}`)
        }
        iterate(value, parent, vars)
    })
    return object
}
