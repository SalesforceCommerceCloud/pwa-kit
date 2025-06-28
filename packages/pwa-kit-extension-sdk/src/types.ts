/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * This is the base configuration type for all Application Extensions. Modify this
 * type if you are adding new configurations that are general to all extensions.
 */
export interface ApplicationExtensionConfig {
    /**
     * Whether or not the extension is enabled. Defaults to `true`.
     */
    enabled?: boolean
    [key: string]: any
}

/**
 * An array tuple where the first value represents the name of the
 * Application Extension NPM package and the second value is the
 * configuration data the Application Extension is initialized with.
 */
export type ApplicationExtensionEntry = [string, ApplicationExtensionConfig]

/**
 * Options to be passed when building the candidate paths used
 * by PWA-Kit build process to discover overrideable extension files.
 */
export type BuildCandidatePathsOptions = {
    projectDir: string
    extensionEntries: ApplicationExtensionEntry[]
    canonicalSource?: string
}
