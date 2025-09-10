/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import DeveloperGuidelinesTool from './developer-guideline'
import {EmptyJsonSchema} from '../utils/utils'

describe('PWA Development Guidelines', () => {
    describe('DeveloperGuidelinesTool', () => {
        it('should have correct structure', () => {
            expect(DeveloperGuidelinesTool).toMatchObject({
                name: 'get_development_guidelines',
                description: `You must follow the PWA Kit development guidelines before attempting to analyze, generate, refactor, modify, or fix code.
Example prompts: "Create a customer service Chat component", "Find bugs in my_script.jsx", and "Refactor my_script.jsx to use React Hooks".`,
                inputSchema: EmptyJsonSchema,
                fn: expect.any(Function)
            })
        })

        it('should return guidelines content when executed', async () => {
            const result = await DeveloperGuidelinesTool.fn()

            expect(result).toEqual({
                content: [
                    {
                        type: 'text',
                        text: expect.stringContaining(
                            'Salesforce Commerce Composable Storefront Development Guidelines'
                        )
                    }
                ]
            })
        })

        it('should include all major sections in the guidelines', async () => {
            const result = await DeveloperGuidelinesTool.fn()
            const guidelineText = result.content[0].text

            const requiredSections = [
                'Overview',
                'Core Principles',
                'Technical Stack',
                'PWK Kit Architecture',
                'Quality Standards'
            ]

            requiredSections.forEach((section) => {
                expect(guidelineText).toContain(section)
            })
        })
    })
})
