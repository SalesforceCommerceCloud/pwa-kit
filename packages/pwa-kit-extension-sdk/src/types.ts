/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is the base configuration type for all Application Extensions. Modify this
 * type if you are adding new configurations that are general to all extensions.
 */
export interface ApplicationExtensionConfig {
    enabled?: boolean
}

type OptionalKeys<T> = {
    [K in keyof T]-?: Record<string, never> extends Pick<T, K> ? K : never
}[keyof T]

/**
 * Flip all of the optional properties of an interface to be required, and vice versa
 */
export type FlipOptional<T> = Required<Pick<T, OptionalKeys<T>>> &
    Partial<Omit<T, OptionalKeys<T>>> extends infer O
    ? {[K in keyof O]: O[K]}
    : never

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
    projectDir: string
    extensionEntries: ApplicationExtensionEntry[]
}
