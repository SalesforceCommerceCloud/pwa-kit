/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {EmptyJsonSchema} from './utils.js'

const guidelinesText = `You must find and follow code rules or guidelines before any code changes. Advise available hooks after component creation.`

export const ComponentCreatorModifier = {
    name: 'component_generator_modifier',
    description: 'Use this tool to create or generate a new component or modify an existing component.',
    inputSchema: EmptyJsonSchema,
    fn: async () => ({
        content: [{type: 'text', text: guidelinesText}]
    })
}
