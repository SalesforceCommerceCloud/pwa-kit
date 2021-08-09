/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2019 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import {buildUrlSet} from './url'

describe('buildUrlSet returns the expected set of urls', () => {
    test('when no values are passed in', () => {
        const set = buildUrlSet()

        expect(set).toEqual([])
    })

    test('when the values array is not empty', () => {
        const set = buildUrlSet('/mens/clothing', 'offset', [0, 5, 10])

        expect(set).toEqual([
            '/mens/clothing?offset=0',
            '/mens/clothing?offset=5',
            '/mens/clothing?offset=10'
        ])
    })

    test('when the values array is empty', () => {
        const set = buildUrlSet('/mens/clothing', 'offset', [])

        expect(set).toEqual([])
    })

    test('when extra parameters are provided', () => {
        const set = buildUrlSet('/mens/clothing', 'offset', [0, 5, 10], {sort: 'high-to-low'})

        expect(set).toEqual([
            '/mens/clothing?offset=0&sort=high-to-low',
            '/mens/clothing?offset=5&sort=high-to-low',
            '/mens/clothing?offset=10&sort=high-to-low'
        ])
    })

    test('when url has existing params', () => {
        const set = buildUrlSet('/mens/clothing?sort=high-to-low', 'offset', [0, 5, 10])

        expect(set).toEqual([
            '/mens/clothing?sort=high-to-low&offset=0',
            '/mens/clothing?sort=high-to-low&offset=5',
            '/mens/clothing?sort=high-to-low&offset=10'
        ])
    })

    test('when valueless params are present', () => {
        const set = buildUrlSet('/mens/clothing?server_only', 'offset', [0, 5, 10])

        expect(set).toEqual([
            '/mens/clothing?server_only&offset=0',
            '/mens/clothing?server_only&offset=5',
            '/mens/clothing?server_only&offset=10'
        ])
    })
})
