/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {render} from '@testing-library/react'
import {ChakraProvider} from '@chakra-ui/react'
import {StoreLocatorProvider} from './components/provider'

const CONFIG = {
    path: '/store-locator',
    radius: 100,
    radiusUnit: 'km',
    defaultPageSize: 10,
    defaultPostalCode: '10178',
    defaultCountry: 'Germany',
    defaultCountryCode: 'DE',
    supportedCountries: [
        {
            countryCode: 'US',
            countryName: 'United States'
        },
        {
            countryCode: 'DE',
            countryName: 'Germany'
        }
    ]
}

const renderWithProviders = (ui, options = {}) => {
    // eslint-disable-next-line react/prop-types
    const Wrapper = ({children}) => (
        <ChakraProvider theme={{}}>
            <StoreLocatorProvider config={CONFIG}>{children}</StoreLocatorProvider>
        </ChakraProvider>
    )
    return render(ui, {wrapper: Wrapper, ...options})
}

export {renderWithProviders}
