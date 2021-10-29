/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {getUrlConfig} from './utils'
import {getLocaleAndSiteBasePath} from './routes-utils'

jest.mock('./utils', () => {
    const original = jest.requireActual('./utils')
    return {
        ...original,
        getUrlConfig: jest.fn()
    }
})

describe('routeModifier', function() {
    test('should return basePath with locale', () => {
        getUrlConfig.mockImplementation(() => ({
            locale: 'path'
        }))
        const locale = 'en-GB'
        const url = getLocaleAndSiteBasePath(locale)
        expect(url).toEqual('/en-GB')
    })
})
