/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApplicationExtensionConfig as ApplicationExtensionConfigBase} from '../../types'
import {ApplicationExtension as ApplicationExtensionBase} from '../application-extension'

// Types
// TODO: Move this to types.
type ExtendedApplicationExtensionConfig = ApplicationExtensionConfigBase
type ApplicationExtension<T extends ApplicationExtensionConfigBase> = ApplicationExtensionBase<T>

const APPLICATION_EXTENSIONS: ApplicationExtension<ExtendedApplicationExtensionConfig>[] = []

// Export the array
export const getApplicationExtensions = () => APPLICATION_EXTENSIONS
