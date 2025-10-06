/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {z} from 'zod'
import fs from 'fs'
import fsp from 'fs/promises'
import path from 'path'
import {PWA_KIT_DESCRIPTIVE_NAME} from '../utils/constants'

const description = `Install the Agent MCP Tool Usage Guidelines for the ${PWA_KIT_DESCRIPTIVE_NAME} into the project`

const InstallAgentRulesTool = {
    name: 'pwakit_install_agent_rules',
    description,
    inputSchema: {
        projectRoot: z.string().describe('Absolute path to the project root'),
        hostAgent: z
            .string()
            .describe('Name of the host IDE/agent invoking this tool (e.g., "cursor")')
    },
    fn: async ({projectRoot, hostAgent} = {}) => {
        if (!projectRoot) {
            return {
                content: [
                    {
                        type: 'text',
                        text: 'Missing required argument: projectRoot (absolute path to the project root)'
                    }
                ]
            }
        }
        const root = projectRoot

        // If host agent is Cursor, install the Cursor rule to .cursor/rules
        const isCursor = !!hostAgent && String(hostAgent).toLowerCase() === 'cursor'
        const destDir = isCursor ? path.join(root, '.cursor', 'rules') : root
        const destFile = isCursor
            ? path.join(destDir, 'pwa-kit-mcp.mdc')
            : path.join(destDir, 'AGENTS.md')

        // Resolve source file relative to this tool file
        const srcFile = path.resolve(
            __dirname,
            isCursor
                ? '../data/ai-instructions/cursor/pwa-kit-mcp.mdc'
                : '../data/ai-instructions/generic/AGENTS.md'
        )

        try {
            if (!fs.existsSync(srcFile)) {
                return {
                    content: [{type: 'text', text: `Source rule file not found at ${srcFile}`}]
                }
            }

            if (isCursor) {
                await fsp.mkdir(destDir, {recursive: true})
            }
            const exists = fs.existsSync(destFile)
            if (exists) {
                try {
                    const [srcContent, destContent] = await Promise.all([
                        fsp.readFile(srcFile, 'utf8'),
                        fsp.readFile(destFile, 'utf8')
                    ])
                    if (srcContent !== destContent) {
                        return {
                            content: [
                                {
                                    type: 'text',
                                    text: `You are a smart assistant that can use tools when needed.
Use the file edit tools to add the following contents to this file "${destFile}":
${srcContent}`
                                }
                            ]
                        }
                    }
                } catch (_) {
                    // If we can't read for comparison, fall back to generic already-installed message
                }
                return {
                    content: [
                        {
                            type: 'text',
                            text: `Rule already installed at ${destFile}. No action taken.`
                        }
                    ]
                }
            }

            await fsp.copyFile(srcFile, destFile)
            return {
                content: [{type: 'text', text: `Installed rule to ${destFile}`}]
            }
        } catch (error) {
            return {
                content: [{type: 'text', text: `Failed to install rule: ${error.message}`}]
            }
        }
    }
}

export default InstallAgentRulesTool
