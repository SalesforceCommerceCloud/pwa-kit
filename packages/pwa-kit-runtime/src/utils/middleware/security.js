/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {CONTENT_SECURITY_POLICY, STRICT_TRANSPORT_SECURITY} from '../../ssr/server/constants'
import {isRemote} from '../ssr-server'

/**
 * This express middleware sets the Content-Security-Policy and Strict-Transport-Security headers to
 * default values that are required for PWA Kit to work. It also patches `res.setHeader` to allow
 * additional CSP directives to be added without removing the required directives, and it prevents
 * the Strict-Transport-Security header from being set on the local dev server.
 * @param {express.Request} req Express request object
 * @param {express.Response} res Express response object
 * @param {express.NextFunction} next Express next callback
 */
export const defaultPwaKitSecurityHeaders = (req, res, next) => {
    /** CSP-compatible origin for Runtime Admin. */
    // localhost doesn't include a protocol because different browsers behave differently :\
    const runtimeAdmin = isRemote() ? 'https://runtime.commercecloud.com' : 'localhost:*'
    /**
     * Map of directive names/values that are required for PWA Kit to work. Array values will be
     * merged with user-provided values; boolean values will replace user-provided values.
     * @type Object.<string, string[] | boolean>
     */
    const directives = {
        'connect-src': ["'self'", runtimeAdmin],
        'frame-ancestors': [runtimeAdmin],
        'img-src': ["'self'", 'data:'],
        'script-src': ["'self'", "'unsafe-eval'", runtimeAdmin],
        // Always upgrade insecure requests when deployed, never upgrade on local dev server
        'upgrade-insecure-requests': isRemote()
    }

    const setHeader = res.setHeader
    res.setHeader = (name, value) => {
        let modifiedValue = value
        switch (name?.toLowerCase()) {
            case CONTENT_SECURITY_POLICY: {
                // If multiple Content-Security-Policy headers are provided, then the most restrictive
                // option is chosen for each directive. Therefore, we must modify *all* directives to
                // ensure that our required directives will work as expected.
                // Ref: https://w3c.github.io/webappsec-csp/#multiple-policies
                modifiedValue = Array.isArray(value)
                    ? value.map((item) => modifyDirectives(item, directives))
                    : modifyDirectives(value, directives)
                break
            }
            case STRICT_TRANSPORT_SECURITY: {
                // Block setting this header on local development server - it will break things!
                if (!isRemote()) return
                break
            }
            default: {
                break
            }
        }
        return setHeader.call(res, name, modifiedValue)
    }
    // Provide an initial CSP (or patch the existing header)
    res.setHeader(CONTENT_SECURITY_POLICY, res.getHeader(CONTENT_SECURITY_POLICY) ?? '')
    // Provide an initial value for HSTS, if not already set - use default from `helmet`
    if (!res.hasHeader(STRICT_TRANSPORT_SECURITY)) {
        res.setHeader(STRICT_TRANSPORT_SECURITY, 'max-age=15552000; includeSubDomains')
    }
    next()
}

/**
 * Updates the given Content-Security-Policy header to include all directives required by PWA Kit.
 * @param {string} original Original Content-Security-Policy header
 * @returns {string} Modified Content-Security-Policy header
 * @private
 */
const modifyDirectives = (original, required) => {
    const directives = original
        .trim()
        .split(';')
        .reduce((acc, directive) => {
            const text = directive.trim()
            if (text) {
                const [name, ...values] = text.split(/ +/)
                acc[name] = values
            }
            return acc
        }, {})

    // Add missing required CSP directives
    for (const [name, value] of Object.entries(required)) {
        if (value === true) {
            // Boolean directive (required) - overwrite original value
            directives[name] = []
        } else if (value === false) {
            // Boolean directive (disabled) - delete original value
            delete directives[name]
        } else {
            // Regular string[] directive - merge values
            // Wrapping with `[...new Set(array)]` removes duplicate entries
            directives[name] = [...new Set([...(directives[name] ?? []), ...value])]
        }
    }

    // Re-construct header string
    return Object.entries(directives)
        .map(([name, values]) => [name, ...values].join(' '))
        .join(';')
}
