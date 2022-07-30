/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook} from '@testing-library/react-hooks'
import useSite from './use-site'
import {SiteProvider} from '../contexts'
import mockConfig from '../../config/mocks/default'

const wrapper = ({children}) => <SiteProvider>{children}</SiteProvider>

let resultSite = {}

beforeEach(() => {
    resultSite = {}
})

const mockSetSite = jest.fn().mockImplementation((site) => {
    resultSite = {site}

    return resultSite
})

const mockUseContext = jest.fn().mockImplementation(() => ({
    site: {},
    setSite: mockSetSite
}))

React.useContext = mockUseContext
describe('useSite', () => {
    it('should set initial site', () => {
        const {result} = renderHook(() => useSite(), {wrapper})

        expect(resultSite).toMatchObject({})

        result.current.setSite({
            site: {
                ...mockConfig.app.sites[0],
                alias: 'uk'
            }
        })

        expect(mockUseContext).toHaveBeenCalled()
        expect(resultSite).toHaveProperty('site')
    })
})
