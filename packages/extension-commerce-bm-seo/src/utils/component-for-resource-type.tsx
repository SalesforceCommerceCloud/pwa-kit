/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {RouteProps} from 'react-router-dom'
/**
 * Finds and returns the React component associated with a given resource type from the router
 *
 * @param {RouteProps[]} routes
 *   The array of route objects, each containing a component and a path.
 * @param {{[key: string]: string}} resourceTypeToComponentMap
 *   A mapping from resource type keys to component display names.
 * @param {string} resourceType
 *   The resource type to look up.
 * @returns {React.ComponentType<any> | undefined}
 *   The matching React component for the resource type, or undefined if not found.
 */
export const getComponentForResourceType = (
    routes: RouteProps[],
    resourceTypeToComponentMap: {[key: string]: string},
    resourceType: string
): React.ComponentType<any> | undefined => {
    const ComponentClass = routes.find((_route) =>
        _route.component?.displayName?.includes(resourceTypeToComponentMap[resourceType])
    )
    return ComponentClass?.component
}
