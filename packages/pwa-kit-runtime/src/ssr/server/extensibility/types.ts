/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {Application} from 'express'

export type {Application}

export interface ApplicationExtensionConfig extends Record<string, unknown> {
    enabled: boolean
}
