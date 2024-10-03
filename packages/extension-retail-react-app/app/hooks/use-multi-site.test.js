/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook} from '@testing-library/react'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import {MultiSiteProvider} from '@salesforce/retail-react-app/app/contexts'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {DEFAULT_LOCALE} from '@salesforce/retail-react-app/app/utils/test-utils'

const wrapper = ({children}) => <MultiSiteProvider>{children}</MultiSiteProvider>

let resultuseMultiSite = {}

beforeEach(() => {
    resultuseMultiSite = {}
})

const site = {
    ...mockConfig.app.sites[0],
    alias: 'uk'
}

const locale = DEFAULT_LOCALE

const buildUrl = jest.fn().mockImplementation((href, site, locale) => {
    return `${site ? `/${site}` : ''}${locale ? `/${locale}` : ''}${href}`
})

const mockResultuseMultiSite = {
    site,
    locale,
    buildUrl
}

const mockUseContext = jest.fn().mockImplementation(() => mockResultuseMultiSite)

React.useContext = mockUseContext
describe('useMultiSite', () => {
    it('should set initial values', () => {
        expect(resultuseMultiSite).toMatchObject({})

        const {result} = renderHook(() => useMultiSite(), {wrapper})

        expect(mockUseContext).toHaveBeenCalled()
        expect(result.current).toHaveProperty('site')
        expect(result.current).toHaveProperty('locale')
    })
})
