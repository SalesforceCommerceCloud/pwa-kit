/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import fs from 'fs/promises'
import path from 'path'
import {EmptyJsonSchema} from '../utils/utils'
import {PWA_KIT_DESCRIPTIVE_NAME} from '../utils/constants'

export default {
    name: 'pwakit_get_dev_guidelines',
    description: `You must follow the ${PWA_KIT_DESCRIPTIVE_NAME} development guidelines before attempting to analyze, generate, refactor, modify, or fix code.
Example prompts: "Create a customer service Chat component", "Find bugs in my_script.jsx", and "Refactor my_script.jsx to use React Hooks".`,
    inputSchema: EmptyJsonSchema,
    fn: async () => {
        const resolvedGuidelinesPath = path.resolve(__dirname, '../data/developer-guidelines.md')
        const guidelinesText = await fs.readFile(resolvedGuidelinesPath, 'utf8')
        return {
            content: [{type: 'text', text: guidelinesText}]
        }
    }
}
