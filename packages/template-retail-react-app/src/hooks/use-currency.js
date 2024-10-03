/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useContext} from 'react'
import {CurrencyContext} from '@salesforce/retail-react-app/app/contexts'

/**
 * Custom React hook to get the currency for the active locale and to change it to a different currency
 * @returns {{currency: string, setCurrency: function}[]}
 */
export const useCurrency = () => {
    const context = useContext(CurrencyContext)
    if (context === undefined) {
        throw new Error('useCurrency must be used within CurrencyProvider')
    }
    return context
}
