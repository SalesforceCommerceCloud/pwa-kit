/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

export interface ApplicationExtensionConfig extends Record<string, unknown> {
    enabled: boolean
}

export type ApplicationExtensionEntryArray = [string, ApplicationExtensionConfig]

export type ApplicationExtensionEntry = ApplicationExtensionEntryArray | string

export type BuildCandidatePathsOptions = {
    projectDir: string
    extensionEntries: ApplicationExtensionEntry[]
}
