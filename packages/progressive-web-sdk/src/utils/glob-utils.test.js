/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import assert from 'assert'
import {Matcher} from './glob-utils'

test('Matcher with no patterns matches nothing', () => {
    const matcher = new Matcher()
    expect(matcher.matches('')).toBe(false)
    expect(matcher.matches('a.js')).toBe(false)
    expect(matcher.matches()).toBe(false)
})

describe('Matcher class filters correctly', () => {
    const patterns = ['ssr.js', '**/*.jpg', '!**/no.jpg', 'static/assets/main.css', 'abc.{js,jsx}']

    const matcher = new Matcher(patterns)

    // Paths we expect to match
    const expectToMatch = [
        'ssr.js',
        'test1.jpg',
        'static/test2.jpg',
        'static/assets/test3.jpg',
        'abc.js',
        'abc.jsx'
    ]

    expectToMatch.forEach((path) =>
        test(`Expect path "${path}" to match`, () => {
            assert.ok(matcher.matches(path), `Expected path "${path}" to be matched`)
        })
    )

    // Paths we expect not to match
    const expectNotToMatch = ['ssrxjs', 'subdirectory/ssr.js', 'no.jpg', 'static/no.jpg', 'abc.jsz']

    expectNotToMatch.forEach((path) =>
        test(`Expect path "${path}" to NOT match`, () => {
            assert.ok(!matcher.matches(path), `Expected path "${path}" to NOT be matched`)
        })
    )

    // Combine the paths into one array and shuffle it
    const allPaths = expectToMatch.concat(expectNotToMatch).sort(() => Math.random() - 0.5)
    test('Matcher.filter works', () => {
        const matched = allPaths.filter(matcher.filter)
        assert.strictEqual(
            matched.length,
            expectToMatch.length,
            'Expected that all matches would be returned by filter'
        )
    })
})
