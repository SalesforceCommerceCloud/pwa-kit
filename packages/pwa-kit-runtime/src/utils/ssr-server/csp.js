/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {isRemote} from './utils'

/**
 * Gets the directive for the given keys, guarding against invalid input.
 * @param {Object.<string, string[] | null>} kebab - Kebab case CSP directive name
 * @param {string} kebab - Kebab case CSP directive name
 * @param {string} camel - Camel case CSP directive name
 * @returns {string[]} CSP directive values
 */
const getDirective = (directives, kebab, camel) => {
    if (kebab in directives && camel in directives) {
        // Helmet doesn't allow it, so we don't either
        throw new Error(`Duplicate Content-Security-Policy directives: ${kebab} ${camel}.`)
    }
    const key = kebab in directives ? kebab : camel
    const value = directives[key]
    if (value === null) {
        // `null` is used to disable CSP directives, but the directives used here are required!
        throw new Error(`Content-Security-Policy directive ${key} cannot be disabled.`)
    }
    return value ?? []
}

/**
 * Gets the origin of Runtime Admin in CSP-compatible format. Used for internal development.
 * @param {string} env - The current node env
 * @returns {string} The origin of Runtime Admin
 */
const getRuntimeAdminOrigin = (env) => {
    // On the local dev server, the env is "development". When deployed to MRT, the env is
    // "production" for both production and staging MRT. To use the "staging" origin, that string
    // must be explicitly passed to `getContentSecurityPolicy` (i.e. you must edit app/ssr.js when
    // doing Storefront Preview work on staging MRT).
    switch (env) {
        case 'development':
            return 'localhost:*'
        case 'staging':
            return 'https://*.mobify-storefront.com'
        default:
            return 'https://runtime.commercecloud.com'
    }
}

/**
 * Gets the Content Security Policy directives for your application.
 * @param {string} env Current execution environment
 * @param {Object.<string, string[] | null>} extraDirectives Additional directives to be merged with the defaults
 * @returns {Object.<string, string[] | null>} CSP directives object that can be used with helmet()
 * @see {@link https://www.npmjs.com/package/helmet#Reference | Helmet documentation}
 */
export const getContentSecurityPolicy = (
    env = process.env.NODE_ENV || 'development',
    extraDirectives = {}
) => {
    // Connecting to Runtime Admin is required to enable Storefront Preview
    const runtimeAdmin = getRuntimeAdminOrigin(env)
    const directives = {
        // Do not upgrade insecure requests for local development
        'upgrade-insecure-requests': isRemote() ? [] : null,
        // upgrade-insecure-requests is a pseudo-boolean ([] = true, null = false), so it can be
        // simply overwritten by spreading the user-provided directives. The directives after the
        // spread are arrays, so they must be merged.
        ...extraDirectives,
        'connect-src': [
            "'self'",
            'api.cquotient.com',
            runtimeAdmin,
            ...getDirective(extraDirectives, 'connect-src', 'connectSrc')
        ],
        'frame-ancestors': [
            runtimeAdmin,
            ...getDirective(extraDirectives, 'frame-ancestors', 'frameAncestors')
        ],
        'img-src': [
            "'self'",
            '*.commercecloud.salesforce.com',
            'data:',
            ...getDirective(extraDirectives, 'img-src', 'imgSrc')
        ],
        'script-src': [
            "'self'",
            "'unsafe-eval'",
            'storage.googleapis.com',
            runtimeAdmin,
            ...getDirective(extraDirectives, 'script-src', 'scriptSrc')
        ]
    }
    return {useDefaults: true, directives}
}
