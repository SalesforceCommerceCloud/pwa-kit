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
export interface ApplicationExtensionConfig extends Record<string, unknown> {
    enabled?: boolean
}

/**
 * When configuring your PWA-Kit Application to use Application Extensions via the config
 */
export type ApplicationExtensionEntryTuple = [string, ApplicationExtensionConfig]

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
