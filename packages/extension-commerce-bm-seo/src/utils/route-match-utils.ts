/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {matchPath as matchPathReactRouter} from 'react-router-dom'
import {RouteProps} from '@salesforce/pwa-kit-extension-sdk/types'

type Match<T = {[key: string]: string}> = ReturnType<typeof matchPathReactRouter<T>>
type MatchWithComponent<T = {[key: string]: string}> = Match<T> & {
    component?: React.ComponentType<any>
}

/**
 * This is an enhanced version of matchPath that allows you to match to multiple routes as well as allowing you to filter out wildcard routes.
 * @param pathname - The URL path to check
 * @param routes - Array of route configurations to check against
 * @param options - Optional configuration for filtering wildcard routes
 * @returns The matching route object or undefined if no match is found
 */
export const matchPath = (
    pathname: string,
    routes: RouteProps[],
    options?: {filterWildcardRoutes: boolean}
): MatchWithComponent | null => {
    let validRoutes = routes
    // Check for undefined paths and log a warning
    const undefinedPaths = routes.filter((route) => !route.path)
    if (undefinedPaths.length > 0) {
        console.warn(
            `Undefined paths detected (${undefinedPaths.length}). This may cause unexpected routing behavior. Undefined paths:`,
            undefinedPaths
        )
    }

    // Filter out routes ending with a wildcard if the option is set
    if (options?.filterWildcardRoutes) {
        const wildcardRoutes = routes.filter((route) => {
            if (Array.isArray(route.path)) {
                return route.path.some((p) => p.endsWith('*'))
            }
            return !!route?.path?.endsWith('*')
        })
        if (wildcardRoutes.length > 1) {
            console.warn(
                `Multiple wildcard routes detected (${wildcardRoutes.length}). This may cause unexpected routing behavior. Wildcard routes:`,
                wildcardRoutes.map((route) => route.path)
            )
        }
        validRoutes = routes.filter((route) => {
            if (Array.isArray(route.path)) {
                return !route.path.some((p) => p.endsWith('*'))
            }
            return !route?.path?.endsWith('*')
        })
    }

    for (const route of validRoutes) {
        const paths = Array.isArray(route.path) ? route.path : [route.path]
        for (const path of paths) {
            const match = matchPathReactRouter(pathname, {
                path,
                exact: true
            })
            if (match) return {...match, component: route.component}
        }
    }

    return null
}
