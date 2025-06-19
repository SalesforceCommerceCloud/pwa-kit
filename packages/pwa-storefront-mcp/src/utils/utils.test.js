/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {EmptyJsonSchema} from './utils'

describe('Utils', () => {
    describe('EmptyJsonSchema', () => {
        it('should be a valid JSON schema', () => {
            expect(EmptyJsonSchema).toEqual({
                $schema: 'http://json-schema.org/draft-07/schema#',
                type: 'object',
                properties: {},
                additionalProperties: false
            })
        })

        it('should have required JSON schema properties', () => {
            expect(EmptyJsonSchema).toHaveProperty('type', 'object')
            expect(EmptyJsonSchema).toHaveProperty('properties')
            expect(EmptyJsonSchema).toHaveProperty('additionalProperties', false)
        })

        it('should not allow additional properties', () => {
            expect(EmptyJsonSchema.additionalProperties).toBe(false)
            expect(EmptyJsonSchema.properties).toEqual({})
        })
    })
})
