/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// First party dependencies
import CREATE_APP_SCHEMA from '@salesforce/pwa-kit-create-app/program.json' assert { type: 'json' }

// Project dependencies
import {EmptyJsonSchema} from './utils.js'


const guidelinesDescription = `
This tool is used to provide the agent with the instructions on how to use the @salesforce/pwa-kit-create-app CLI tool to create a new PWA Kit projects.

## Instructions

1. If prompted to create a new project using a preset, only list available presets to be selected from.
2. If a preset is provided, use the \`--preset\` flag to select a preset.
3. If prompted to create a new project using a template, only list available presets to be selected from.
4. If a template name is provided, immediately use the "questions" for that template to query the user.
5. When creating a template only execute the project generation if all the answers are provided.

IMPORTANT: You should not attempt to create a new PWA Kit project WITHOUT having used this tool first!!
IMPORTANT: When querying the user for answers only ask on question at a time, do not list all questions at once!!
IMPORTANT: If asked to create a project using a template, DO NOT ask or provide preset options to them, only template options if one wasn't already provided.
IMPORTANT: If asked to create a project using a preset, DO NOT ask or provide template options to them, only preset options if one wasn't already provided.
`

export default {
    name: 'create-app_guidelines',
    description: guidelinesDescription,
    inputSchema: EmptyJsonSchema,
    fn: async () => {
        try {
            console.error('CWD:', process.cwd(), process.env.WORKSPACE_FOLDER_PATHS)

            console.error(CREATE_APP_SCHEMA)

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                        {
                            cli: CREATE_APP_SCHEMA.metadata.description,
                            schemas: {...CREATE_APP_SCHEMA.schemas},
                            data: {...CREATE_APP_SCHEMA.data}
                        },
                        null,
                        2
                    )}
                ]
            }
        } catch (err) {
            return `Failed to fetch CLI help: ${err instanceof Error ? err.message : String(err)}`
        }
    }
}
