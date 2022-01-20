/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {getUrlConfig} from './url-config'
import {buildPathWithUrlConfig} from './url-config'

jest.mock('./utils', () => {
    const original = jest.requireActual('./utils')
    return {
        ...original,
        getUrlConfig: jest.fn()
    }
})

describe('buildPathWithUrlConfig', () => {
    test('return a new url with locale value as a part of path', () => {
        getUrlConfig.mockImplementation(() => ({
            locale: 'path'
        }))

        const url = buildPathWithUrlConfig('/women/dresses', {locale: 'en-GB'})
        expect(url).toEqual('/en-GB/women/dresses')
    })

    test('return a new url with locale value as a query param', () => {
        getUrlConfig.mockImplementation(() => ({
            locale: 'query_param'
        }))

        const url = buildPathWithUrlConfig('/women/dresses', {locale: 'en-GB'})
        expect(url).toEqual('/women/dresses?locale=en-GB')
    })
})
