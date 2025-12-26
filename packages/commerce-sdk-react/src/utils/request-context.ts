/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * Request context for storing per-request data on the server
 * Only available during server-side execution
 */
interface RequestContext {
    cookies?: string
    headers?: Record<string, string>
}

/**
 * AsyncLocalStorage for maintaining request context across async operations
 * This allows Auth to access request cookies without prop drilling
 *
 * Only available on server-side (async_hooks is a Node.js-only module)
 */
let AsyncLocalStorageClass: any
if (typeof window === 'undefined') {
    try {
        // Server-side only - dynamically require async_hooks
        // Use string concatenation to prevent webpack from trying to bundle it
        const moduleName = 'async_' + 'hooks'
        // eslint-disable-next-line @typescript-eslint/no-var-requires
        AsyncLocalStorageClass = eval('require')(moduleName).AsyncLocalStorage
    } catch (e) {
        // If require fails (e.g., webpack bundling), create a no-op class
        AsyncLocalStorageClass = class {
            run(store: any, callback: Function) {
                return callback()
            }
            getStore() {
                return undefined
            }
        }
    }
}

export const requestContextStorage: any = typeof window === 'undefined'
    ? new AsyncLocalStorageClass()
    : {
        // Client-side stub - these methods will never be called on client
        run: (_store: any, callback: Function) => callback(),
        getStore: () => undefined
    }

/**
 * Get the current request context (server-side only)
 * @returns RequestContext or undefined if not available
 */
export function getRequestContext(): RequestContext | undefined {
    if (typeof window !== 'undefined') {
        return undefined  // Client-side - no request context
    }
    return requestContextStorage.getStore()
}

/**
 * Get cookies from the current request context
 * @returns Cookie header string or undefined
 */
export function getRequestCookies(): string | undefined {
    return getRequestContext()?.cookies
}

/**
 * Parse a cookie header string into a key-value map
 * @param cookieHeader - Cookie header string (e.g., "key1=value1; key2=value2")
 * @returns Object with cookie key-value pairs
 */
export function parseCookieHeader(cookieHeader: string): Record<string, string> {
    const cookies: Record<string, string> = {}

    if (!cookieHeader) {
        return cookies
    }

    cookieHeader.split(';').forEach(cookie => {
        const [key, ...valueParts] = cookie.trim().split('=')
        if (key && valueParts.length > 0) {
            const value = valueParts.join('=')  // Handle values with '=' in them
            cookies[key] = decodeURIComponent(value)
        }
    })

    return cookies
}
