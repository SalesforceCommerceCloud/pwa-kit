/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/*
 * This is a simple implementation of the Cloudflare rule language to support
 * MRT rules for proxy.
 * It is not a complete implementation of the Cloudflare rule language but
 * implements the most common expressions and functions available for MRT routing
 * Reference: https://developers.cloudflare.com/ruleset-engine/rules-language/
 */

const EXPR_REPLACEMENTS = [
    {
        // to avoid modifying string prototype
        from: /\bhttp.request.uri.path\b/g,
        to: 'http.request._path'
    },
    {
        from: /\band\b/g,
        to: '&&'
    },
    {
        from: /\bor\b/g,
        to: '||'
    },
    {
        from: /\bnot\b/g,
        to: '!'
    },
    {
        from: /\beq\b/g,
        to: '==='
    },
    {
        from: /\smatches\s?("[^"]+")/g,
        to: '.match($1) '
    },
    {
        from: /\s~\s?("[^"]+")/g,
        to: '.match($1) '
    },
    {
        from: /\scontains\s?("[^"]+")/g,
        to: '.includes($1) '
    }
]

// subset of functions most useful for processing the fields available for MRT rules
const TRANSFORMS = {
    lower: (str) => str.toLowerCase(),
    upper: (str) => str.toUpperCase(),
    concat: (...args) => args.join(''),
    ends_with: (str, suffix) => str.endsWith(suffix),
    starts_with: (str, prefix) => str.startsWith(prefix),
    len: (str) => str.length,
    regex_replace: (str, regex, replacement) => str.replace(new RegExp(regex, 'g'), replacement)
}

/**
 * Parse rule expression to function
 *
 * @param {string} ruleExpression
 * @return {string} javascript expression that can be evaluated to match the rule
 */
export function parseRuleExpression(ruleExpression) {
    EXPR_REPLACEMENTS.forEach((replacement) => {
        ruleExpression = ruleExpression.replace(replacement.from, replacement.to)
    })

    return ruleExpression
}

/**
 * @typedef {Object} RequestFields
 * @property {string} host hostname
 * @property {string} uri full uri including query string
 * @property {string} path path only
 * @property {string} cookies full cookies string
 */

/**
 * Evaluate a rule expression against the request fields
 *
 * @param {string} ruleExpression mrt rule expression
 * @param {RequestFields} requestFields fields of the request to match again
 * @return {boolean} does the rule evaluation to true for the given options
 */
export function evaluateRule(ruleExpression, {host, uri, path, cookies = ''} = {}) {
    const parsedExpression = parseRuleExpression(ruleExpression)

    const args = ['http'].concat(Object.keys(TRANSFORMS)).concat(`return ${parsedExpression}`)
    try {
        const func = new Function(...args)
        return !!func.apply(
            undefined,
            [
                {
                    host: host,
                    request: {
                        uri: uri,
                        _path: path
                    },
                    cookies: cookies
                }
            ].concat(Object.values(TRANSFORMS))
        )
    } catch (e) {
        console.error('Error evaluating rule. Check compiled expression: ', parsedExpression)
        throw e
    }
}
