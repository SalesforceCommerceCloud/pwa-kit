/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import path from 'path'
import fs from 'fs'

import * as extract from './extract-routes'
import * as examples from './router-examples'

test('extractRouteRegexesFromSource extracts routes using an AST', () => {
    expect(extract.extractRouteRegexesFromSource(examples.EXAMPLE_ROUTE_SRC)).toEqual(
        examples.EXAMPLE_ROUTE_REGEX
    )
})

test('extractRouteRegexesFromSource does not crash on bad inputs', () => {
    expect(extract.extractRouteRegexesFromSource('')).toEqual([])
    expect(extract.extractRouteRegexesFromSource('// Some comment')).toEqual([])
})

const regressionTestCases = [
    path.resolve(__dirname, 'examples', 'laura-mercier'),
    path.resolve(__dirname, 'examples', 'level'),
    path.resolve(__dirname, 'examples', 'reitmans'),
    path.resolve(__dirname, 'examples', 'space-nk')
]

regressionTestCases.forEach((dir) => {
    test(`Should maintain the behavior of the original extract-regexes script [case ${dir}]`, () => {
        const sourceCode = fs.readFileSync(path.resolve(dir, 'router.txt'), {encoding: 'utf8'})
        const expectedRoutes = require(path.resolve(dir, 'loader-routes')).default
        expect(extract.extractRouteRegexesFromSource(sourceCode)).toEqual(expectedRoutes)
    })
})
