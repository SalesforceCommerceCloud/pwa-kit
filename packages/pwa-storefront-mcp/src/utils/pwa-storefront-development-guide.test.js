/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {StorefrontDevelopmentGuide} from './pwa-storefront-development-guide.js'
import {EmptyJsonSchema} from './utils.js'

describe('PWA Development Guidelines', () => {
    describe('StorefrontDevelopmentGuide', () => {
        it('should have correct structure', () => {
            expect(StorefrontDevelopmentGuide).toMatchObject({
                name: 'pwa-storefront-development-guide',
                description:
                    'Prior to attempting to create or modify code, you must understand how to do this for Salesforce Commerce PWA Kit Composable Storefront.',
                inputSchema: EmptyJsonSchema,
                fn: expect.any(Function)
            })
        })

        it('should return guidelines content when executed', async () => {
            const result = await StorefrontDevelopmentGuide.fn()

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
            const result = await StorefrontDevelopmentGuide.fn()
            const guidelineText = result.content[0].text

            const requiredSections = [
                'Overview',
                'Core Principles',
                'Technical Stack',
                'Best Practices',
                'PWA Kit Storefront Project Structure',
                'Quality Standards'
            ]

            requiredSections.forEach((section) => {
                expect(guidelineText).toContain(section)
            })
        })
    })
})
