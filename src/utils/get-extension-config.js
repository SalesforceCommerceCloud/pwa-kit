/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Platform Imports
import {extensionConfigs} from '@salesforce/pwa-kit-extension-sdk/react'
import extensionMeta from '../../extension-meta.json'

export const getExtensionConfig = () => extensionConfigs[extensionMeta.id]
