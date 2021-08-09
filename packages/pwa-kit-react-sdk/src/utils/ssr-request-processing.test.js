/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

/* eslint-env jest */
/* eslint max-nested-callbacks:0 */

import {QueryParameters} from './ssr-request-processing'

describe('Query parameter tests', () => {
    test('Empty querystring', () => {
        const qp = new QueryParameters('')
        expect(qp.parameters.length).toEqual(0)
        expect(qp.keys.length).toEqual(0)
        expect(qp.toString()).toEqual('')
    })

    test('Undefined querystring', () => {
        const qp = new QueryParameters()
        expect(qp.parameters.length).toEqual(0)
        expect(qp.keys.length).toEqual(0)
        expect(qp.toString()).toEqual('')
    })

    test('Decodes & encodes', () => {
        const qs = 'CMP=1&xyz=2&a&b=&&c=%2e'
        const qp = new QueryParameters(qs)
        expect(qp.parameters.length).toEqual(6)
        expect(qp.keys.length).toEqual(6)
        expect(qp.toString()).toEqual('CMP=1&xyz=2&a&b=&&c=.')

        expect(qp.parameters[0].key).toEqual('cmp')
        expect(qp.parameters[0].originalKey).toEqual('CMP')
        expect(qp.parameters[0].value).toEqual('1')

        expect(qp.parameters[2].key).toEqual('a')
        expect(qp.parameters[2].value).toBe(null)
        expect(qp.parameters[2].originalValue).toBe(null)

        expect(qp.parameters[3].key).toEqual('b')
        expect(qp.parameters[3].value).toBe('')
        expect(qp.parameters[3].originalValue).toBe('')

        expect(qp.parameters[4].key).toEqual('')
        expect(qp.parameters[4].value).toBe(null)
        expect(qp.parameters[4].originalValue).toBe(null)

        expect(qp.parameters[5].key).toEqual('c')
        expect(qp.parameters[5].value).toBe('.')
        expect(qp.parameters[5].originalValue).toBe('%2e')
    })

    test('Append and deleteByKey', () => {
        const qp = new QueryParameters()
        expect(qp.parameters.length).toEqual(0)
        expect(qp.keys.length).toEqual(0)
        expect(qp.toString()).toEqual('')

        qp.appendParameter('x', '2')
        qp.appendParameter('y', '3')
        qp.appendParameter('z', null)
        qp.appendParameter('q')
        expect(qp.toString()).toEqual('x=2&y=3&z&q')

        qp.deleteByKey('x')
        expect(qp.toString()).toEqual('y=3&z&q')
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
            expect(qp.parameters.length).toEqual(1)
            expect(qp.toString()).toEqual(`${data.escaped}=${data.escaped}`)
        })
    })

    test('Filter and from()', () => {
        const qs = 'a=1&b=2&c=3'
        const qp1 = new QueryParameters(qs)
        expect(qp1.parameters.length).toEqual(3)
        expect(qp1.keys.length).toEqual(3)
        expect(qp1.toString()).toEqual(qs)

        const qp2 = QueryParameters.from(qp1.parameters.filter((p) => p.key !== 'b'))
        expect(qp2.parameters.length).toEqual(2)
        expect(qp2.keys.length).toEqual(2)
        expect(qp2.toString()).toEqual('a=1&c=3')
    })
})
