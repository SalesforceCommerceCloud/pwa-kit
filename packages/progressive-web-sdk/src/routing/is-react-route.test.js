/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {
    setRouteList,
    setBlacklist,
    getRouteList,
    getBlacklist,
    isReactRoute
} from './is-react-route'

const testReactRegex = /\/react$/
const testAnotherRegex = /\/path1?$/
const routeList = [/\/$/, testReactRegex, testAnotherRegex]
const blacklist = ['something', '/(one|two)$']

beforeEach(() => {
    setRouteList(routeList)
    expect(getRouteList()).toEqual(routeList)
    setBlacklist(blacklist)
    expect(getBlacklist().length).toBe(2)
})

// *******************************************************
// In testing, the origin is set to https://www.mobify.com
// *******************************************************

const testReactRoutes = (truth, testCases) => {
    testCases.forEach((url) => expect(isReactRoute(url)).toBe(truth))
}

test('rejects blacklisted routes', () => {
    testReactRoutes(false, [
        'http://www.mobify.com/something',
        'http://www.mobify.com/somethingelse',
        'http://www.mobify.com/one',
        'http://www.mobify.com/two',
        '/something',
        '/one',
        '/two'
    ])
})

test('blacklist is stored on the window.Progressive object', () => {
    const blacklist = [/test/, /test2/]
    setBlacklist(blacklist)

    expect(window.Progressive.blacklist).toEqual(blacklist)
})

test('rejects pages on other origins', () => {
    testReactRoutes(false, [
        'http://www.mobify.com/react',
        'https://www.google.com/',
        'http://en.wikipedia.org/wiki/Mobify'
    ])
})

test('rejects protocol-relative urls', () => {
    testReactRoutes(false, [
        '//www.mobify.com/react',
        '//gmail.google.com',
        '//cdn.mobify.com/assets/images/test.png'
    ])
})

test('accepts relative URLs that match the regexes', () => {
    testReactRoutes(true, ['/react', '/path', '/path1'])
})

test("rejects relative URLs that don't match the regexes", () => {
    testReactRoutes(false, ['/jquery', '/path2', '/react/subpath'])
})

test('accepts pages on the same origin that match', () => {
    testReactRoutes(true, [
        'https://www.mobify.com/react',
        'https://www.mobify.com/path',
        'https://www.mobify.com/path1'
    ])
})

test("rejects pages on the same origin that don't match", () => {
    testReactRoutes(false, [
        'https://www.mobify.com/jquery',
        'https://www.mobify.com/path2',
        'https://www.mobify.com/react/subpath'
    ])
})

const testSuffixInvariance = (suffixes) => {
    const testCases = [
        'http://www.mobify.com/react',
        'https://www.mobify.com/react',
        'https://www.mobify.com/path2',
        'http://google.com/',
        '//google.com/',
        '/react',
        '/path1',
        '/path2'
    ]

    testCases.forEach((url) =>
        suffixes.forEach((suffix) => {
            expect(isReactRoute(`${url}${suffix}`)).toBe(isReactRoute(url))
        })
    )
}

test('does not care about query strings', () => {
    testSuffixInvariance(['?test', '?item=5', '?item?test'])
})

test('does not care about fragments', () => {
    testSuffixInvariance(['#head', '#body', '#foot'])
})

test('does not care about queries with fragments', () => {
    testSuffixInvariance(['?test#head', '?test#body', '?item=5#foot'])
})
