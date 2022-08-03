/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook} from '@testing-library/react-hooks'
import useUrlTemplate from './use-url-template'
import {MultiSiteProvider} from '../contexts'
import mockConfig from '../../config/mocks/default'
import {DEFAULT_LOCALE} from '../utils/test-utils'

const wrapper = ({children}) => <MultiSiteProvider>{children}</MultiSiteProvider>

let resultUseUrlTemplate = {}

beforeEach(() => {
    resultUseUrlTemplate = {}
})

const site = {
    ...mockConfig.app.sites[0],
    alias: 'uk'
}

const locale = DEFAULT_LOCALE

const fillUrlTemplate = jest.fn().mockImplementation((href, site, locale) => {
    return `${site ? `/${site}` : ''}${locale ? `/${locale}` : ''}${href}`
})

const mockResultUseUrlTemplate = {
    site,
    locale,
    fillUrlTemplate
}

const mockUseContext = jest.fn().mockImplementation(() => mockResultUseUrlTemplate)

React.useContext = mockUseContext
describe('useUrlTemplate', () => {
    it('should set initial values', () => {
        expect(resultUseUrlTemplate).toMatchObject({})

        const {result} = renderHook(() => useUrlTemplate(), {wrapper})

        expect(mockUseContext).toHaveBeenCalled()
        expect(result.current).toHaveProperty('site')
        expect(result.current).toHaveProperty('locale')
    })
})
