/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Utillty function that converts an express route pattern into a regex.
 *
 * This is used in build-remote-server's removeBasePathMiddleware to check
 * whether an incoming request path will match a registered Express endpoint.
 *
 * @param {string} routePattern - The express route pattern to convert
 * @returns {RegExp} - The regex that corresponds to the express route pattern
 * @throws {Error} - If the route pattern is invalid
 */
export const convertExpressRouteToRegex = (routePattern) => {
    if (!routePattern) return null
    if (routePattern instanceof RegExp) return routePattern
    if (typeof routePattern !== 'string') return null

    try {
        // If it's a string, it's an Express route pattern that needs conversion
        // Express route patterns can contain:
        // - Static paths: /users, /about
        // - Route parameters: :id, :userId
        // - Optional parameters: :id?
        // - Regex constraints: :id(\d+)
        // - Wildcards: *, /*
        // - Optional characters: abc?
        // - Optional groups: (abc)?

        let regexPattern = routePattern

        // Step 1: Handle regex constraints in parameters like :param(regex)
        // Example: /search/:query(\d+) -> /search/(\d+)
        // Store the constraints to prevent them from being escaped later
        const constraints = []
        regexPattern = regexPattern.replace(
            /:([^(/]+)\(([^)]+)\)/g,
            (match, paramName, constraint) => {
                const constraintId = `__CONSTRAINT_${constraints.length}__`
                constraints.push(constraint)
                return constraintId
            }
        )

        // Step 2: Handle complex optional parameter sequences first
        // For patterns like /api/:version?/users/:id?/posts/:postId?
        // We need to make literal segments optional when they're followed by optional parameters
        regexPattern = regexPattern.replace(
            /\/([a-zA-Z0-9_-]+)\/:([^(/]+)\?/g,
            (match, segment, param) => `(?:/${segment}(?:/[^/]+)?)?`
        )

        // Step 3: Handle remaining optional parameters :param?
        // For /users/:id?, we want to match both /users and /users/123
        // So we need to replace the entire pattern, not just the parameter
        regexPattern = regexPattern.replace(/\/:([^(/]+)\?/g, '(?:/[^/]+)?')

        // Step 4: Handle regular parameters :param
        regexPattern = regexPattern.replace(/:([^(/]+)/g, '[^/]+')

        // Step 5: Handle wildcards
        // Express wildcards * should be converted to .* which matches everything including slashes
        // Handle /* first, then handle standalone * (but not if it's already been converted)
        regexPattern = regexPattern.replace(/\/\*/g, '/.*')
        // Handle standalone * that hasn't been converted yet
        regexPattern = regexPattern.replace(/(?<!\.)\*(?!\*)/g, '.*')

        // Step 6: Handle wildcard + optional parameter combinations
        // For example /users*/:id?
        regexPattern = regexPattern.replace(
            // eslint-disable-next-line no-useless-escape
            /\.\*\/\(\?\:\/\[(\^\/)\]\+\)\?/g,
            '.*(?:/(?:[^/]+)?)?'
        )

        // Step 7: Handle optional groups (user|admin) -> (?:user|admin)
        regexPattern = regexPattern.replace(/\(([^)]*\|[^)]*)\)/g, '(?:$1)')

        // Step 8: Handle optional characters in literal strings
        // For patterns like /favori?te, /colou?r, /analy?se
        // The ? makes the preceding character optional
        regexPattern = regexPattern.replace(/([a-zA-Z0-9])\?/g, (match, char) => `(?:${char})?`)

        // Step 9: Fix double slashes that may have been created
        regexPattern = regexPattern.replace(/\/\//g, '/')

        // Step 10: Restore regex constraints without escaping
        constraints.forEach((constraint, index) => {
            const constraintId = `__CONSTRAINT_${index}__`
            regexPattern = regexPattern.replace(constraintId, `(${constraint})`)
        })

        // Step 10.5: Handle optional parameters with regex constraints
        // For patterns like /users/:id(\d+)?, we need to make the entire constraint group optional
        // This step must be applied after the constraints are restored but before root path handling
        // Only apply to actual constraint groups, not already processed optional groups
        regexPattern = regexPattern.replace(/\(([^)]+)\)\?/g, (match, content) => {
            // Only convert if this looks like a regex constraint (contains regex patterns like \d, \w, etc.)
            // and is not already an optional group (doesn't start with ?:)
            if (
                (/\\[dwDsS]/.test(content) || /[^a-zA-Z0-9\s]/.test(content)) &&
                !content.startsWith('?:')
            ) {
                return `(?:${content})?`
            }
            return match
        })

        // Step 11: Only escape literal characters that need escaping, but not regex constraints
        // Don't escape curly braces {} as they're used in regex quantifiers
        // eslint-disable-next-line no-useless-escape
        regexPattern = regexPattern.replace(/[\$]/g, '\\$&')

        // Step 12: Handle root path optional parameters
        // For patterns like /:id? or /*, we need to handle the root path correctly
        if (regexPattern === '^(?:/[^/]+)?$') {
            // This is a root optional parameter, should match both / and /something
            regexPattern = '^(?:/|/[^/]+)$'
        } else if (regexPattern === '^/.*$') {
            // This is a root wildcard, should match everything including /
            regexPattern = '^/.*$'
        }

        return new RegExp(`^${regexPattern}$`)
    } catch (error) {
        throw new Error(`Invalid route pattern: ${routePattern}`)
    }
}
