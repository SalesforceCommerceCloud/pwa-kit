/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// Types
import {ApplicationExtensionConfig as ApplicationExtensionConfigBase} from '../../types'
import {ApplicationExtension as ApplicationExtensionBase} from '../ApplicationExtension'

// interface ExtendedApplicationExtensionConfig extends ApplicationExtensionConfigBase {}
// Declare the generic type `T` and extend it from `ApplicationExtensionConfigBase`
type ApplicationExtension<T extends ApplicationExtensionConfigBase> = ApplicationExtensionBase<T>

// Define an array of ApplicationExtension
const APPLICATION_EXTENSIONS: ApplicationExtension<any>[] = []
// const APPLICATION_EXTENSIONS: ApplicationExtension<ExtendedApplicationExtensionConfig>[] = []
// Export the array
export default APPLICATION_EXTENSIONS
