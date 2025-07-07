/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import path from 'path'

// Project dependencies
import {EmptyJsonSchema, isMonoRepo, runCommand} from './utils'

// const CREATE_APP_VERSION = 'latest'
const CREATE_APP_VERSION = '3.11.0-nightly-20250630080227'
const CREATE_APP_COMMAND = isMonoRepo()
    ? path.resolve(
          `${process.env.WORKSPACE_FOLDER_PATHS}/packages/pwa-kit-create-app/scripts/create-mobify-app.js`
      )
    : `@salesforce/pwa-kit-create-app@${CREATE_APP_VERSION}`
const DISPLAY_PROGRAM_COMMAND = '--displayProgram'
const NPX_COMMAND = 'npx'

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
- Use the \`${NPX_COMMAND}\` command to run the \`${CREATE_APP_COMMAND}\` CLI tool when creating a new project.
`

export default {
    name: 'create_app_guidelines',
    description: `This tool is used to provide the agent with the instructions on how to use the @salesforce/pwa-kit-create-app CLI tool to create a new PWA Kit projects. Do not attempt to create a project without using this tool first.`,
    inputSchema: EmptyJsonSchema,
    fn: async () => {
        let programOutput = ''

        // Run the display program and get the output.
        try {
            programOutput = await runCommand(NPX_COMMAND, [
                CREATE_APP_COMMAND,
                DISPLAY_PROGRAM_COMMAND
            ])
        } catch (err) {
            console.error('Failed to run display program:', err)
        }

        // Parse the output and get the data, metadata, and schemas.
        const {
            data,
            metadata: {description: cli},
            schemas
        } = JSON.parse(programOutput)

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
    }
}
