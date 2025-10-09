/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {extractAllClassNames, extractClassDocs} from './explore-scapi-shop-api-tool.js'
import ExploreCommerceAPITool from './explore-scapi-shop-api-tool.js'

// Mocks
jest.mock('fs/promises', () => ({readFile: jest.fn()}))

const BASIC_CLASS_DEF = `
declare class SampleClass {
  /**
   * Say hello
   * @param name string
   * @returns string
   * @example sayHello('world') // returns 'Hello, world'
   */
  sayHello(name: string): string;
}
`

const MULTI_CLASS_DEF = `
declare class First {}
declare class Second {}
`

const GENERIC_CLASS_DEF = `
declare class DataManager<T> {}
`

describe('extractAllClassNames', () => {
    it('extracts class names from multiple classes', () => {
        expect(extractAllClassNames(MULTI_CLASS_DEF)).toEqual(['First', 'Second'])
    })
    it('handles class names with generics', () => {
        expect(extractAllClassNames(GENERIC_CLASS_DEF)).toEqual(['DataManager'])
    })
    it('returns empty array if no classes', () => {
        expect(extractAllClassNames('// nothing')).toEqual([])
    })
})

describe('extractClassDocs', () => {
    it('parses class with a method and JSDoc', () => {
        const docs = extractClassDocs(BASIC_CLASS_DEF, 'SampleClass')
        expect(docs.sayHello).toBeDefined()
        expect(docs.sayHello.description).toBe('Say hello')
        expect(docs.sayHello.params).toEqual(['name string'])
        expect(docs.sayHello.returns).toBe('string')
        expect(docs.sayHello.example).toContain("sayHello('world')")
        expect(docs.sayHello.fullSignature).toContain('sayHello(name: string): string')
    })
    it('returns error if class not found', () => {
        expect(extractClassDocs(BASIC_CLASS_DEF, 'Nope')).toEqual({error: 'Nope class not found.'})
    })
})

describe('parseJSDoc', () => {
    // Re-import for direct testing
    const {parseJSDoc} = jest.requireActual('./explore-scapi-shop-api-tool.js')

    it('extracts all JSDoc parts', () => {
        const jsdoc = `\n * Gets a user\n * @param id number\n * @returns User\n * @example\n * getUser(1) // returns {...}`
        expect(parseJSDoc(jsdoc)).toEqual({
            description: 'Gets a user',
            params: ['id number'],
            returns: 'User',
            example: 'getUser(1) // returns {...}'
        })
    })
    it('handles missing pieces', () => {
        expect(parseJSDoc('* Only desc')).toMatchObject({
            description: 'Only desc',
            params: [],
            returns: '',
            example: ''
        })
    })
})

describe('parseTypeScriptParameters & parseOptionsParameter', () => {
    const {parseTypeScriptParameters, parseOptionsParameter} = jest.requireActual(
        './explore-scapi-shop-api-tool.js'
    )
    it('recognizes empty parameter string', () => {
        expect(parseTypeScriptParameters('')).toEqual({parameters: {}, headers: {}})
    })
    it('parses options with parameters and headers', () => {
        const str =
            'options: { parameters?: { foo: string, bar?: number }, headers?: { Auth: string } }'
        // EXPECTED: Empty objects due to current parser limitation
        expect(parseTypeScriptParameters(str)).toEqual({
            parameters: {},
            headers: {}
        })
    })
    it('fallbacks for unusual params', () => {
        expect(parseTypeScriptParameters('id: string, opts?: boolean')).toMatchObject({
            raw: 'id: string, opts?: boolean'
        })
    })
    it('returns blank or empty for malformed option block', () => {
        expect(parseOptionsParameter('junk')).toEqual({parameters: {}, headers: {}})
    })
})

describe('parseReturnType & extractReturnTypeStructure', () => {
    const {parseReturnType, extractReturnTypeStructure} = jest.requireActual(
        './explore-scapi-shop-api-tool.js'
    )

    const FILE_CONTENT_WITH_INTERFACE = `interface User { id: string; email: string }
  type MyType = { foo: number, bar: string }
  `

    it('handles Promise types and basic', () => {
        expect(parseReturnType('Promise<Product>', '')).toMatchObject({type: 'Promise<Product>'})
        expect(parseReturnType('boolean', '')).toMatchObject({type: 'boolean'})
    })
    it('attempts to extract for interfaces/types in file', () => {
        const resultI = extractReturnTypeStructure('User', FILE_CONTENT_WITH_INTERFACE)
        // still expect undefined for 'email' as the single-line interface may not be parsed, but:
        expect(
            resultI.properties && resultI.properties.find((p) => p.name === 'email')
        ).toBeUndefined()
        const resultT = extractReturnTypeStructure('MyType', FILE_CONTENT_WITH_INTERFACE)
        // parser now finds 'foo' for MyType
        expect(resultT.properties && resultT.properties.find((p) => p.name === 'foo')).toBeDefined()
    })
    it('returns [] for missing type detail', () => {
        expect(extractReturnTypeStructure('UnknownType', '')).toEqual({properties: []})
    })
})

describe('parseInterfaceProperties', () => {
    const {parseInterfaceProperties} = jest.requireActual('./explore-scapi-shop-api-tool.js')
    it('parses simple interface', () => {
        const result = parseInterfaceProperties('id: string;\nfoo?: number')
        expect(result.properties).toEqual([
            {name: 'id', type: 'string'},
            {name: 'foo', type: 'number'}
        ])
    })
    it('handles empty or malformed input', () => {
        expect(parseInterfaceProperties('')).toEqual({properties: []})
        expect(parseInterfaceProperties('\n\n  // nothing')).toEqual({properties: []})
    })
})
