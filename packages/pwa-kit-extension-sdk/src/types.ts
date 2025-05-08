/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {RouteProps} from 'react-router-dom'
import {ApplicationExtension} from './shared/classes/application-extension-base'
import {ApiClientConfig} from '@salesforce/commerce-sdk-react'

/**
 * This is the base configuration type for all Application Extensions. Modify this
 * type if you are adding new configurations that are general to all extensions.
 */
export interface ApplicationExtensionConfig {
    enabled?: boolean
}

/**
 * When configuring your PWA-Kit Application to use Application Extensions via the config
 */
export type ApplicationExtensionEntryTuple = [
    string,
    ApplicationExtensionConfig & Record<string, unknown>
]

/**
 * This type represents the array entry in the "extensions" property of your PWA-Kit
 * application configuration.
 */
export type ApplicationExtensionEntry = ApplicationExtensionEntryTuple | string

/**
 * This type is used in the resolver utility for passing in the currently configured
 * Application Extensions and the projects working directory.
 */
export type BuildCandidatePathsOptions = {
    canonicalSource: string
    projectDir: string
    extensionEntries: ApplicationExtensionEntry[]
}

export interface CommerceApiConfig extends Omit<ApiClientConfig, 'proxy'> {
    proxyPath: string
}

/**
 * Parameters for the `getRoutes` and `getRoutesAsync` methods
 */
export interface GetRoutesParams {
    locals: Record<string, any>
}

/**
 * Parameters for the `beforeRouteMatch` method
 */
export interface BeforeRouteMatchParams {
    allRoutes: RouteProps[]
    locals: Record<string, any>
}

/**
 * This type is used in getComponentMap() to map the component name to the component itself
 * when deserializing an extension.
 */
export type ComponentMap = {
    [key in ReturnType<
        ApplicationExtension<ApplicationExtensionConfig>['getName']
    >]: React.ComponentType<any>
}

/**
 * This type represents the route props returned by getRoutesAsync().
 */
export type AsyncRouteProps = RouteProps & {
    componentProps?: Record<string, any>
}

/**
 * This type represents the serialized version of the route props.
 * It is used when serializing the route props on the server and when
 * deserializing them on the client.
 */
export type SerializedRouteProps = RouteProps & {
    componentName?: string
    componentProps?: Record<string, any>
}
