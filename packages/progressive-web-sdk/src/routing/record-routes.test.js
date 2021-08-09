/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {Route} from 'react-router'
import * as examples from './router-examples'

import {
    doOneOrMany,
    extractRoute,
    findRegexpMatches,
    patternToRegex,
    extractRouteRegexes,
    recordRoutes
} from './record-routes'

test('doOneOrMany applies the function to non-array items', () => {
    const testFn = jest.fn()
    testFn.mockReturnValue('tester')

    const testArg = {test: true}

    expect(doOneOrMany(testArg, testFn)).toBe('tester')
    expect(testFn).toHaveBeenCalledTimes(1)
    expect(testFn).toBeCalledWith(testArg)
})

test('doOneOrMany maps the function over an array', () => {
    const testFn = jest.fn()
    testFn.mockReturnValue(5)

    const testArg = [1, 2, 3, 4]

    const result = doOneOrMany(testArg, testFn)

    expect(result.length).toBe(testArg.length)
    expect(testFn).toHaveBeenCalledTimes(testArg.length)
    for (let i = 0; i < result.length; i++) {
        expect(result[i]).toBe(5)
        expect(testFn.mock.calls[i][0]).toBe(testArg[i])
    }
})

test('doOneOrMany flattens the results of the map', () => {
    const testFn = () => [1, 2]

    const testArg = [1, 1]

    expect(doOneOrMany(testArg, testFn)).toEqual([1, 2, 1, 2])
})

test('extractRoute extracts the route from a single Route', () => {
    const routes = extractRoute(<Route path="/test" />)

    expect(routes).toEqual(['/test'])
})

test('extractRoute extracts from nested Routes', () => {
    const routes = extractRoute(examples.EXAMPLE_ROUTE)

    expect(routes).toEqual(['/', '/test', '/testdir', '/testdir/true', '/testdir/*', '/**'])
})

test('findRegexpMatches finds all of the matches of a regex in a string', () => {
    const matches = findRegexpMatches(/ab/g, 'ababab')

    expect(matches.length).toBe(3)
    for (let i = 0; i < 3; i++) {
        expect(matches[i].length).toBe(1)
        expect(matches[i][0]).toBe('ab')
    }
})

test('findRegexpMatches extracts the text outside matches literally', () => {
    const input = 'qabcdazefaar'
    const expected = ['q', ['ab'], 'cd', ['az'], 'ef', ['aa'], 'r']

    const matches = findRegexpMatches(/a./g, input)

    expect(matches.length).toEqual(expected.length)

    for (let i = 0; i < matches.length; i++) {
        if (typeof expected[i] === 'string') {
            expect(matches[i]).toEqual(expected[i])
        } else {
            expect(matches[i].length).toEqual(expected[i].length)
            expect(matches[i][0]).toEqual(expected[i][0])
        }
    }
})

test('patternToRegex converts a literal path correctly', () => {
    expect(patternToRegex('/testing/a/literal.html')).toBe('^/testing/a/literal\\.html/?$')
})

test('patternToRegex converts a path with route variables correctly', () => {
    expect(patternToRegex('/:category/show/:product')).toBe('^/[^/]+/show/[^/]+/?$')
    expect(patternToRegex('/:category/:product')).toBe('^/[^/]+/[^/]+/?$')
})

test('patternToRegex converts a path with * correctly', () => {
    expect(patternToRegex('/*/product.html')).toBe('^/.*?/product\\.html/?$')
})

test('patternToRegex converts a path with ** correctly', () => {
    expect(patternToRegex('/test/**')).toBe('^/test/.*/?$')
})

test('patternToRegex converts a path with an optional piece correctly', () => {
    expect(patternToRegex('/thing(/otherthing)')).toBe('^/thing(?:/otherthing)?/?$')
})

test('patternToRegex converts a path with everything correctly', () => {
    expect(patternToRegex('/:root(/:optional)/test*/**')).toBe('^/[^/]+(?:/[^/]+)?/test.*?/.*/?$')
})

test('extractRouteRegexes creates an array of regexes', () => {
    const arrayToString = (arr) =>
        arr
            .slice()
            .sort()
            .toString() // eslint-disable-line newline-per-chained-call
    const extractedRegexArray = extractRouteRegexes(examples.EXAMPLE_ROUTE)
    const extractedRegexAsString = arrayToString(extractedRegexArray)
    const expectedRegexAsString = arrayToString(examples.EXAMPLE_ROUTE_REGEX)

    expect(extractedRegexArray instanceof Array).toBeTruthy()
    expect(extractedRegexAsString).toBe(expectedRegexAsString)
})

test('recordRoutes calls its function', () => {
    const func = jest.fn()

    recordRoutes(func, examples.EXAMPLE_ROUTE)

    expect(func.mock.calls.length).toBe(1)
})
