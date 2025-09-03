/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import CreateAppGuidelineTool from './create-app-guideline'
import {EmptyJsonSchema} from '../utils/utils'

jest.mock('../utils/utils', () => {
    const originalModule = jest.requireActual('../utils/utils')
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const path = require('path')
    const mockScriptPath = path.resolve('../pwa-kit-create-app/scripts/create-mobify-app.js')

    return {
        ...originalModule,
        isMonoRepo: jest.fn(() => true),
        getCreateAppCommand: jest.fn(() => mockScriptPath)
    }
})

describe('PWA Create App Guidelines', () => {
    describe('CreateAppGuidelineTool', () => {
        it('should have correct structure', () => {
            expect(CreateAppGuidelineTool).toMatchObject({
                name: 'create_storefront_app',
                description: `
    
This tool is used to provide the agent with the instructions on how to use the @salesforce/pwa-kit-create-app CLI tool to create a new PWA Kit projects.

Do not attempt to create a project without using this tool first.

Example Triggers:
- "Create a new PWA Kit app"
- "Start a new storefront using a preset"
- "What templates are available for PWA Kit?"
- "What presets are available for PWA Kit?"`,
                inputSchema: EmptyJsonSchema,
                fn: expect.any(Function)
            })
        })

        it('should return guidelines content when executed', async () => {
            // NOTE: THIS TEST IS SIMPLY A SANITY CHECK TO ENSURE THE TOOL IS WORKING.
            // IT DOES NOT TEST THE CONTENT OF THE GUIDELINES IN ITS ENTIRETY.
            const result = await CreateAppGuidelineTool.fn()

            expect(result).toEqual({
                content: [
                    {
                        type: 'text',
                        text: expect.stringContaining('PWA Kit Create App — Agent Usage Guidelines')
                    }
                ]
            })
        })

        it('should include all major sections in the guidelines', async () => {
            const result = await CreateAppGuidelineTool.fn()
            const guidelineText = result.content[0].text

            const requiredSections = [
                'Overview',
                'General Rules',
                'Creating a Project Using a Preset',
                'Creating a Project Using a Template',
                'Important Reminders'
            ]

            requiredSections.forEach((section) => {
                expect(guidelineText).toContain(section)
            })
        })
    })
})

afterAll(() => {
    delete process.env.WORKSPACE_FOLDER_PATHS
})
