/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// Project dependencies
import {EmptyJsonSchema, getCreateAppCommand, isMonoRepo, runCommand} from '../utils/utils'
import logger from '../utils/logger.js'
import {z} from 'zod'

const CREATE_APP_COMMAND = getCreateAppCommand()
const DISPLAY_PROGRAM_FLAG = '--displayProgram'
const COMMAND_RUNNER = isMonoRepo() ? 'node' : 'npx'

const guidelinesText = `
# PWA Kit Create App — Agent Usage Guidelines

## Overview

This document defines the behavior agents must follow when using the \`@salesforce/pwa-kit-create-app\` CLI tool to generate new PWA Kit projects. The CLI supports both **presets** and **templates** for project creation, and agents must clearly distinguish between these two modes of operation.

---

## General Rules

- Always use this tool to initiate project creation. Never attempt to manually create a project outside of this process.
- Ask one question at a time when gathering information from the user.
- Do not mix presets and templates. Only show or ask about one based on the user's intent.
- Never proceed with project generation unless all required information has been collected.

---

## Creating a Project Using a Preset

If the user requests a project using a **preset**:

- List only the available presets.
- If a preset is provided, use the \`--preset\` flag with the CLI.
- Do not ask for or display any template options.

---

## Creating a Project Using a Template

If the user requests a project using a **template**:

- List only the available templates.
- If a template is provided:
  - Use its associated questions to prompt the user, one at a time.
  - Do not proceed with project generation until all required answers have been collected.
- Do not ask for or display any preset options.

---

## Important Reminders

- Never attempt to create a project without using this tool.
- When gathering answers for a template, ask questions one at a time to maintain clarity.
- Presets and templates are mutually exclusive paths. Do not offer both options unless explicitly requested.
- Do not pass any flags to the \`${CREATE_APP_COMMAND}\` CLI tool that are not listed in the program.json options".
- Use the \`${COMMAND_RUNNER}\` command to run the \`${CREATE_APP_COMMAND}\` CLI tool when creating a new project.
- After project creation, prompt the user if **they want to do version control through git** using the **version_control_git** MCP tool.
`

// Extend input schema to accept optional prompt
const InputSchemaWithPrompt = z
    .object({})
    .strict()
    .extend({
        prompt: z.string().optional().describe('Original user prompt text that triggered this tool')
    })

export default {
    name: 'create_app_guidelines',
    description: `
This tool is used to provide the agent with the instructions on how to use the @salesforce/pwa-kit-create-app CLI tool to create a new PWA Kit projects.

Do not attempt to create a project without using this tool first. 
!IMPORTANT:The original prompt that triggered this tool should be provided to the tool as a "prompt" parameter.

Example Triggers:
- "Create a new PWA Kit app"
- "Start a new storefront using a preset"
- "What templates are available for PWA Kit?"
- "What presets are available for PWA Kit?"`,
    inputSchema: InputSchemaWithPrompt,
    fn: async (input) => {
        const {prompt} = input || {}
        if (prompt) {
            logger.info({prompt}, 'create_app_guidelines tool triggered by prompt')
        } else {
            logger.info('create_app_guidelines tool invoked without prompt')
        }

        try {
            logger.debug(
                {
                    command: COMMAND_RUNNER,
                    args: [
                        ...(COMMAND_RUNNER === 'npx' ? ['--yes'] : []),
                        CREATE_APP_COMMAND,
                        DISPLAY_PROGRAM_FLAG
                    ]
                },
                'Running create app display program command'
            )

            const programOutput = await runCommand(COMMAND_RUNNER, [
                ...(COMMAND_RUNNER === 'npx' ? ['--yes'] : []),
                CREATE_APP_COMMAND,
                DISPLAY_PROGRAM_FLAG
            ])

            logger.debug('Received output from create app display program command')

            const {
                data,
                metadata: {description: cli},
                schemas
            } = JSON.parse(programOutput)

            logger.info('Successfully parsed CLI display program output')

            return {
                content: [
                    {
                        type: 'text',
                        text: JSON.stringify(
                            {
                                guidelines: guidelinesText,
                                cli,
                                schemas,
                                data
                            },
                            null,
                            2
                        )
                    }
                ]
            }
        } catch (error) {
            logger.error({err: error}, 'Error running create_app_guidelines tool')
            throw error // propagate error to caller if desired
        }
    }
}
