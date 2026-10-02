/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
    MAX_PDP_QUESTIONS,
    parsePdpQuestions
} from '@salesforce/retail-react-app/app/utils/inline-agent-widget-utils'

describe('parsePdpQuestions', () => {
    test('parses a JSON-encoded array of strings (SCAPI c_pdpQuestions shape)', () => {
        const raw =
            '["What does SmartTrack do?", "Does it track sleep automatically?", "Tell me about the reminders to move."]'
        expect(parsePdpQuestions(raw)).toEqual([
            'What does SmartTrack do?',
            'Does it track sleep automatically?',
            'Tell me about the reminders to move.'
        ])
    })

    test('returns [] for null / undefined / empty / non-string input', () => {
        expect(parsePdpQuestions(undefined)).toEqual([])
        expect(parsePdpQuestions(null)).toEqual([])
        expect(parsePdpQuestions('')).toEqual([])
        expect(parsePdpQuestions(42)).toEqual([])
        expect(parsePdpQuestions(['already', 'parsed'])).toEqual([])
    })

    test('returns [] (does not throw) for non-JSON input', () => {
        expect(() => parsePdpQuestions('not-json')).not.toThrow()
        expect(parsePdpQuestions('not-json')).toEqual([])
    })

    test('returns [] when the JSON parses to something other than an array', () => {
        expect(parsePdpQuestions('"just a string"')).toEqual([])
        expect(parsePdpQuestions('{"q":"x"}')).toEqual([])
        expect(parsePdpQuestions('null')).toEqual([])
    })

    test('drops non-string entries and trims / dedupes / caps at 5', () => {
        expect(parsePdpQuestions('["ok", 42, null, "  padded  ", "ok", "kept"]')).toEqual([
            'ok',
            'padded',
            'kept'
        ])
        const many = JSON.stringify(['Q1', 'Q2', 'Q3', 'Q4', 'Q5', 'Q6'])
        const out = parsePdpQuestions(many)
        expect(out).toHaveLength(MAX_PDP_QUESTIONS)
        expect(out).toEqual(['Q1', 'Q2', 'Q3', 'Q4', 'Q5'])
    })

    test('respects an explicit maxCount override', () => {
        expect(parsePdpQuestions('["A","B","C","D"]', 2)).toEqual(['A', 'B'])
    })
})
