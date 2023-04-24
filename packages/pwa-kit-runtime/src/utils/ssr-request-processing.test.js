/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {QueryParameters} from './ssr-request-processing'

describe('Query parameter tests', () => {
    test('Empty querystring', () => {
        const qp = new QueryParameters('')
        expect(qp.parameters).toHaveLength(0)
        expect(qp.keys).toHaveLength(0)
        expect(qp.toString()).toBe('')
    })

    test('Undefined querystring', () => {
        const qp = new QueryParameters()
        expect(qp.parameters).toHaveLength(0)
        expect(qp.keys).toHaveLength(0)
        expect(qp.toString()).toBe('')
    })

    test('Decodes & encodes', () => {
        const qs = 'CMP=1&xyz=2&a&b=&&c=%2e'
        const qp = new QueryParameters(qs)
        expect(qp.parameters).toHaveLength(6)
        expect(qp.keys).toHaveLength(6)
        expect(qp.toString()).toBe('CMP=1&xyz=2&a&b=&&c=.')

        expect(qp.parameters[0].key).toBe('cmp')
        expect(qp.parameters[0].originalKey).toBe('CMP')
        expect(qp.parameters[0].value).toBe('1')

        expect(qp.parameters[2].key).toBe('a')
        expect(qp.parameters[2].value).toBeNull()
        expect(qp.parameters[2].originalValue).toBeNull()

        expect(qp.parameters[3].key).toBe('b')
        expect(qp.parameters[3].value).toBe('')
        expect(qp.parameters[3].originalValue).toBe('')

        expect(qp.parameters[4].key).toBe('')
        expect(qp.parameters[4].value).toBeNull()
        expect(qp.parameters[4].originalValue).toBeNull()

        expect(qp.parameters[5].key).toBe('c')
        expect(qp.parameters[5].value).toBe('.')
        expect(qp.parameters[5].originalValue).toBe('%2e')
    })

    test('Append and deleteByKey', () => {
        const qp = new QueryParameters()
        expect(qp.parameters).toHaveLength(0)
        expect(qp.keys).toHaveLength(0)
        expect(qp.toString()).toBe('')

        qp.appendParameter('x', '2')
        qp.appendParameter('y', '3')
        qp.appendParameter('z', null)
        qp.appendParameter('q')
        expect(qp.toString()).toBe('x=2&y=3&z&q')

        qp.deleteByKey('x')
        expect(qp.toString()).toBe('y=3&z&q')
    })

    test('Special characters handling', () => {
        const test_cases = [
            {
                original: '@#$%^+|{}[]<>,/? "', // These characters should be escaped.
                escaped: '%40%23%24%25%5E%2B%7C%7B%7D%5B%5D%3C%3E%2C%2F%3F%20%22'
            },
            {
                original: "-_.!~*'()", // These characters won't be escaped, so they should remain the same.
                escaped: "-_.!~*'()"
            },
            // We are not supposed to escape characters -_.!~*'(), so if we see them in the query string, we will
            // unescape them.
            {
                original: '%2d%5f%2e%21%7e%2a%27%28%29',
                escaped: "-_.!~*'()"
            },
            {
                original: 'Casing-Should-Be-Preserved',
                escaped: 'Casing-Should-Be-Preserved'
            }
        ]
        test_cases.forEach((data) => {
            const qp = new QueryParameters(`${data.original}=${data.original}`)
            expect(qp.parameters).toHaveLength(1)
            expect(qp.toString()).toBe(`${data.escaped}=${data.escaped}`)
        })
    })

    test('Filter and from()', () => {
        const qs = 'a=1&b=2&c=3'
        const qp1 = new QueryParameters(qs)
        expect(qp1.parameters).toHaveLength(3)
        expect(qp1.keys).toHaveLength(3)
        expect(qp1.toString()).toEqual(qs)

        const qp2 = QueryParameters.from(qp1.parameters.filter((p) => p.key !== 'b'))
        expect(qp2.parameters).toHaveLength(2)
        expect(qp2.keys).toHaveLength(2)
        expect(qp2.toString()).toBe('a=1&c=3')
    })
})
