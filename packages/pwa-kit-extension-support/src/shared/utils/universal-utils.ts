/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Types 
import {ApplicationExtensionConfig} from '../../types'

// Local
import {ApplicationExtension} from '../..'
import APPLICATION_EXTENSIONS from '../../assets/application-extensions-placeholder'

export const getApplicationExtensions = (): ApplicationExtension<ApplicationExtensionConfig>[] => APPLICATION_EXTENSIONS
