/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {renderHook} from '@testing-library/react'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks/use-currency'
import {CurrencyProvider} from '@salesforce/retail-react-app/app/contexts'
import {DEFAULT_CURRENCY} from '@salesforce/retail-react-app/app/constants'

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
