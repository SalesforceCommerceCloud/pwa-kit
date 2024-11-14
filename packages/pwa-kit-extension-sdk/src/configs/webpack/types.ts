/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Third-Party
import {LoaderContext} from 'webpack'
import {ApplicationExtensionEntryTuple} from '../../types'

export interface ApplicationExtensionsLoaderOptions {
    configured: ApplicationExtensionEntryTuple[]
    target: 'node' | 'web'
}

export type ApplicationExtensionsLoaderContext = LoaderContext<ApplicationExtensionsLoaderOptions>
