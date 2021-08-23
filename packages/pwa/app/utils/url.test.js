/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {buildUrlSet, categoryUrlBuilder, productUrlBuilder, searchUrlBuilder} from './url'

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

describe('url builder test', () => {
    test('searchUrlBuilder returns expect', () => {
        const url = searchUrlBuilder('term')

        expect(url).toEqual('/search?q=term')
    })

    test('productUrlBuilder returns expect', () => {
        const url = productUrlBuilder({id: 'productId'})

        expect(url).toEqual('/en/product/productId')
    })

    test('categoryUrlBuilder returns expect', () => {
        const url = categoryUrlBuilder({id: 'men'})
        expect(url).toEqual(`/en/category/men`)
    })
})
