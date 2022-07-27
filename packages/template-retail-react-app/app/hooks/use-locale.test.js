/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook} from '@testing-library/react-hooks'
import useLocale from './use-locale'
import {LocaleProvider} from '../contexts'
import {DEFAULT_CURRENCY, DEFAULT_LOCALE} from '../utils/test-utils'

const wrapper = ({children}) => <LocaleProvider>{children}</LocaleProvider>

let resultLocale = {}

beforeEach(() => {
    resultLocale = {}
})

const mockSetLocale = jest.fn().mockImplementation((locale) => {
    resultLocale = {locale}

    return resultLocale
})

const mockUseContext = jest.fn().mockImplementation(() => ({
    locale: {},
    setLocale: mockSetLocale
}))

React.useContext = mockUseContext
describe('useLocale', () => {
    it('should set initial locale', () => {
        const {result} = renderHook(() => useLocale(), {wrapper})

        expect(resultLocale).toMatchObject({})

        result.current.setLocale({
            id: DEFAULT_LOCALE,
            preferredCurrency: DEFAULT_CURRENCY
        })

        expect(mockUseContext).toHaveBeenCalled()
        expect(resultLocale).toHaveProperty('locale')
    })
})
