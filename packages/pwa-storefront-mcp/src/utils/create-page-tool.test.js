/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import CreatePageTool from './create-page-tool'
import {EmptyJsonSchema} from './utils'

describe('Create Page Tool', () => {
    it('should have correct structure', () => {
        expect(CreatePageTool).toMatchObject({
            name: 'create_override_customize_page',
            description: expect.stringContaining(
                'Agent must follow this guide to create a new page'
            ),
            inputSchema: EmptyJsonSchema,
            fn: expect.any(Function)
        })
    })

    it('should return guidelines content when executed', async () => {
        const result = await CreatePageTool.fn()
        expect(result).toEqual({
            content: [
                {
                    type: 'text',
                    text: expect.stringContaining(
                        'Create and Override Pages in PWA Kit Composable Storefront'
                    )
                }
            ]
        })
    })

    it('should include all major sections in the guidelines', async () => {
        const result = await CreatePageTool.fn()
        const guidelineText = result.content[0].text
        const requiredSections = [
            'Overview',
            'Instruction to verify if Extensibility is Enabled',
            'Instructiong to Create a New Page',
            'Overriding an Existing Page',
            'Special Components'
        ]
        requiredSections.forEach((section) => {
            expect(guidelineText).toContain(section)
        })
    })
})
