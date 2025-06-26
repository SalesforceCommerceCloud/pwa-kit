/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
// Third party dependencies
import {exec} from 'child_process'
import {promisify} from 'util'

// Project dependencies
import {EmptyJsonSchema} from './utils.js'

const execAsync = promisify(exec)

const guidelinesDescription = `
This tool is used to provide the agent with the instructions on how to use the @salesforce/pwa-kit-create-app CLI tool to create a new PWA Kit projects.

## Instructions

1. If prompted to create a new project using a preset, only list available presets.
2. If a preset is provided, use the \`--preset\` flag to select a preset.
3. If prompted to create a new project using a template, only list available presets.
4. If a template name is provided, immediately use the "questions" for that template to query the user one question at a time.
5. When creating a template only execute the project generation if all the answers are provided.

IMPORTANT: When querying the user for answers only ask on question at a time!!
IMPORTANT: You should not attempt to create a new PWA Kit project WITHOUT having used this tool first!!
`

export default {
    name: 'create-app_guidelines',
    description: guidelinesDescription,
    inputSchema: EmptyJsonSchema,
    fn: async () => {
        try {
            console.error('CWD:', process.cwd(), process.env.WORKSPACE_FOLDER_PATHS)
            // TODO: This should be done in maybe one call?
            const {stdout: helpOutput} = await execAsync('npx @salesforce/pwa-kit-create-app --help', {
                cwd: `/Users/bchypak/Projects/pwa-kit/packages/pwa-storefront-mcp`,
                maxBuffer: 1024 * 1024
            })

            const {stdout: templateSchemaOutput} = await execAsync('npx @salesforce/pwa-kit-create-app --schema templates', {
                cwd: `/Users/bchypak/Projects/pwa-kit/packages/pwa-storefront-mcp`,
                maxBuffer: 1024 * 1024
            })

            const {stdout: presetSchemaOutput} = await execAsync('npx @salesforce/pwa-kit-create-app --schema presets', {
                cwd: `/Users/bchypak/Projects/pwa-kit/packages/pwa-storefront-mcp`,
                maxBuffer: 1024 * 1024
            })

            const {stdout: validatorSchemaOutput} = await execAsync('npx @salesforce/pwa-kit-create-app --schema validators', {
                cwd: `/Users/bchypak/Projects/pwa-kit/packages/pwa-storefront-mcp`,
                maxBuffer: 1024 * 1024
            })

            const {stdout: templatesOutput} = await execAsync('npx @salesforce/pwa-kit-create-app --templates', {
                cwd: `/Users/bchypak/Projects/pwa-kit/packages/pwa-storefront-mcp`,
                maxBuffer: 1024 * 1024
            })

            const {stdout: presetsOutput} = await execAsync('npx @salesforce/pwa-kit-create-app --presets', {
                cwd: `/Users/bchypak/Projects/pwa-kit/packages/pwa-storefront-mcp`,
                maxBuffer: 1024 * 1024
            })

            const {stdout: validatorsOutput} = await execAsync('npx @salesforce/pwa-kit-create-app --validators', {
                cwd: `/Users/bchypak/Projects/pwa-kit/packages/pwa-storefront-mcp`,
                maxBuffer: 1024 * 1024
            })

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                        {
                            cli: helpOutput,
                            schemas: {
                                templates: templateSchemaOutput,
                                presets: presetSchemaOutput,
                                validators: validatorSchemaOutput
                            },
                            data: {
                                templates: templatesOutput,
                                presets: presetsOutput,
                                validators: validatorsOutput
                            }
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
