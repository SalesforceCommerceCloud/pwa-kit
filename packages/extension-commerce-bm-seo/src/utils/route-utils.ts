/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {Redirect, RouteProps} from 'react-router-dom'
import {getComponentForResourceType} from './component-for-resource-type'
import {UrlMappingResponse} from '../types'

/**
 * Add component that is mapped to the resource type from the URL Mapping SEO API response
 * to the router with the path. If there is no resource type from the URL Mapping SEO API response,
 * the component is a Redirect to the destination URL.
 *
 * @param {Location} location - The current location object.
 * @param {RouteProps[]} routes - The routes array.
 * @param {[key: string]: string} resourceTypeToComponentMap - The resource type to component map.
 * @param {UrlMappingResponse} urlMappingResponse - The response from the Url Mapping SEO API.
 * @param {function} setRoutes - Function to set the routes.
 * @returns {void}
 */
const addComponentToRoutes = (
    location: Location,
    routes: RouteProps[],
    resourceTypeToComponentMap: {[key: string]: string},
    urlMappingResponse: any,
    setRoutes: (routes: RouteProps[]) => void
) => {
    let Component: React.ComponentType<any> | undefined
    let componentProps: Record<string, any> = {}
    // If the Redirect type is URL do a Redirect, else load matching component
    if (!urlMappingResponse.resourceType) {
        Component = Redirect
        componentProps = {
            to: urlMappingResponse.destinationUrl
        }
    } else {
        Component = getComponentForResourceType(
            routes,
            resourceTypeToComponentMap,
            urlMappingResponse.resourceType
        )
        componentProps = {
            [`${String(urlMappingResponse.resourceType)}Id`]: urlMappingResponse.resourceId
        }
    }
    setRoutes([
        {
            path: location.pathname,
            component: () => (Component ? React.createElement(Component, componentProps) : null)
        },
        ...routes
    ])
}

/**
 * Call the URL Mapping SEO API and add the mapped component to the router,
 * if the URL Mapping SEO API call is not skipped. If there is no redirect rule,
 * router is not updated and original url is navigated to.
 *
 * @param {Location} location - The current location object.
 * @param {boolean} skipMappingCall - Whether to skip the URL Mapping SEO API call.
 * @param {function} setUrlSegment - Function to set the url segment.
 * @param {React.MutableRefObject<((result?: object) => void) | undefined>} resolveRef - The ref object to resolve the promise of the URL Mapping SEO API call.
 * @param {RouteProps[]} routes - The routes array.
 * @param {[key: string]: string} resourceTypeToComponentMap - The resource type to component map.
 * @param {function} setRoutes - Function to set the routes.
 * @returns {Promise<void>} - A promise that resolves when the navigation block is handled.
 */
export const handleNavigationBlock = async (
    location: Location,
    skipMappingCall: boolean,
    setUrlSegment: (segment: string) => void,
    resolveRef: React.MutableRefObject<((result?: object) => void) | undefined>,
    routes: RouteProps[],
    resourceTypeToComponentMap: {[key: string]: string},
    setRoutes: (routes: RouteProps[]) => void
) => {
    // Early exit if configured to check the Router Context first and found a matching route
    if (skipMappingCall) {
        return
    }
    // Query the Url Mapping API by updating the urlSegment state and get the response from the promise of ref
    const urlMappingResponse = await new Promise<UrlMappingResponse | undefined>((resolve) => {
        resolveRef.current = resolve
        setUrlSegment(location.pathname)
    })
    // If no redirect rule exists, go to original url
    if (urlMappingResponse === undefined) {
        return
    }
    addComponentToRoutes(
        location,
        routes,
        resourceTypeToComponentMap,
        urlMappingResponse,
        setRoutes
    )
}
