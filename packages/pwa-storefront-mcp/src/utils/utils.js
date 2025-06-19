/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {zodToJsonSchema} from 'zod-to-json-schema'
import {z} from 'zod'

// Private schema used to generate the JSON schema
const emptySchema = z.object({}).strict()

export const EmptyJsonSchema = zodToJsonSchema(emptySchema)
