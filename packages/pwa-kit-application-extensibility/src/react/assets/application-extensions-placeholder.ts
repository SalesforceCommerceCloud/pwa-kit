/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {ApplicationExtensionConfig as ApplicationExtensionConfigBase} from '../../types'
import {ApplicationExtension as ApplicationExtensionBase} from '../ApplicationExtension'

// Types
// TODO: Move these.
type ExtendedApplicationExtensionConfig = ApplicationExtensionConfigBase
type ApplicationExtension<T extends ApplicationExtensionConfigBase> = ApplicationExtensionBase<T>

// Define an array of ApplicationExtension
const APPLICATION_EXTENSIONS: ApplicationExtension<ExtendedApplicationExtensionConfig>[] = []

export const getApplicationExtensions = async () => APPLICATION_EXTENSIONS
