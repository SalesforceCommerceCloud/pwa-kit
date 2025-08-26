/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {generateSfdcUserAgent} from '@salesforce/retail-react-app/app/utils/sfdc-user-agent-utils'

describe('sfdc-user-agent-utils', () => {
    describe('generateSfdcUserAgent', () => {
        test('should generate correct sfdc_user_agent header value', () => {
            const userAgent = generateSfdcUserAgent()

            expect(userAgent).toMatch(/^pwa-kit-react-sdk@[\d\w.-]+ commerce-sdk-react@[\d\w.-]+$/)
            expect(userAgent).toContain('pwa-kit-react-sdk@')
            expect(userAgent).toContain('commerce-sdk-react@')
        })

        test('should return proper NPM-style package@version format', () => {
            const userAgent = generateSfdcUserAgent()

            const parts = userAgent.split(' ')
            expect(parts).toHaveLength(2)

            parts.forEach((part) => {
                expect(part).toMatch(/^[\w-]+@[\d\w.-]+$/)
                expect(part).toContain('@')
            })
        })

        test('should not return null or undefined', () => {
            const userAgent = generateSfdcUserAgent()

            expect(userAgent).toBeDefined()
            expect(userAgent).not.toBeNull()
            expect(typeof userAgent).toBe('string')
            expect(userAgent.length).toBeGreaterThan(0)
        })

        test('should handle error cases gracefully', () => {
            expect(() => generateSfdcUserAgent()).not.toThrow()

            const userAgent = generateSfdcUserAgent()
            expect(userAgent).toBeDefined()
            expect(typeof userAgent).toBe('string')
            expect(userAgent.length).toBeGreaterThan(0)
        })

        test('should return valid package identifiers', () => {
            // This test verifies that the function returns the expected package identifiers
            const userAgent = generateSfdcUserAgent()

            // Should always return a valid string
            expect(typeof userAgent).toBe('string')
            expect(userAgent.length).toBeGreaterThan(0)

            // Should contain expected package identifiers
            expect(userAgent).toMatch(/pwa-kit-react-sdk@/)
            expect(userAgent).toMatch(/commerce-sdk-react@/)
        })

        test('should be valid HTTP header value', () => {
            const userAgent = generateSfdcUserAgent()

            // HTTP headers must contain only ASCII printable characters
            const isValidHTTPHeader = /^[\x20-\x7E]*$/.test(userAgent)
            expect(isValidHTTPHeader).toBe(true)

            // Prevent excessively long headers that might cause issues with proxies/servers
            expect(userAgent.length).toBeLessThan(500)
        })

        test('should use @ symbol for NPM convention alignment', () => {
            const userAgent = generateSfdcUserAgent()

            // Ensure both packages use @ format for consistency with NPM tooling
            const atSymbolCount = (userAgent.match(/@/g) || []).length
            expect(atSymbolCount).toBe(2)
        })
    })
})
