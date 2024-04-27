/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {createCodeVerifier, generateCodeChallenge} from './pkce'
import seedrandom from 'seedrandom'

describe('PKCE Utility Functions', () => {
    describe('createCodeVerifier', () => {
        test('should generate unique code verifiers', () => {
            const verifiers = new Set()
            const numVerifiers = 100

            for (let i = 0; i < numVerifiers; i++) {
                const verifier = createCodeVerifier()
                verifiers.add(verifier)
            }
            expect(verifiers.size).toBe(numVerifiers)
        })

        test('should provide sufficient entropy', () => {
            const seed1 = 123456789
            const seed2 = 987654321
            seedrandom(seed1, {global: true})
            const verifier1 = createCodeVerifier()
            seedrandom(seed2, {global: true})
            const verifier2 = createCodeVerifier()
            // the generated verifiers should be different because we're using different seeds
            expect(verifier1).not.toBe(verifier2)
        })
    })

    describe('generateCodeChallenge', () => {
        test('should generate a code challenge based on the provided code verifier', async () => {
            const codeVerifier = createCodeVerifier()
            const codeChallenge = await generateCodeChallenge(codeVerifier)

            expect(codeChallenge).toBeDefined()
        })
    })
})
