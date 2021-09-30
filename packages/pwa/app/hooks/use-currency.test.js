/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook} from '@testing-library/react-hooks'
import {useCurrency} from './use-currency'
import {CurrencyProvider} from '../contexts'
import {DEFAULT_CURRENCY} from '../constants'

const wrapper = ({children}) => <CurrencyProvider>{children}</CurrencyProvider>

let resultCurrency = {}

const mockSetCurrency = jest.fn().mockImplementation((currency) => {
    resultCurrency = {currency}

    return resultCurrency
})

const mockUseContext = jest.fn().mockImplementation(() => ({
    currency: {},
    setCurrency: mockSetCurrency
}))

React.useContext = mockUseContext
describe('useCurrency', () => {
    it('should set initial currency', () => {
        const {result} = renderHook(() => useCurrency(), {wrapper})

        expect(resultCurrency).toMatchObject({})

        result.current.setCurrency(DEFAULT_CURRENCY)

        expect(mockUseContext).toHaveBeenCalled()
        expect(resultCurrency).toMatchObject({currency: DEFAULT_CURRENCY})
    })
})
