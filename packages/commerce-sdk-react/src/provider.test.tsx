/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {render, screen} from '@testing-library/react'
// TODO: how to move this import into setup-jest.js file
import '@testing-library/jest-dom'

import useCommerceApi from './hooks/useCommerceApi'
import CommerceApiProvider from './provider'

test('useCommerceApi returns a set of api clients', () => {
    const Component = () => {
        const api = useCommerceApi()
        return <div>{api?.shopperSearch && 'success'}</div>
    }

    render(
        <CommerceApiProvider
            proxy="http://localhost:3000/mobify/proxy/api"
            clientId="c9c45bfd-0ed3-4aa2-9971-40f88962b836"
            organizationId="f_ecom_zzrf_001"
            shortCode="8o7m175y"
            siteId="RefArchGlobal"
            locale="en_US"
            currency="USD"
        >
            <Component />
        </CommerceApiProvider>
    )

    expect(screen.getByText(/success/i)).toBeInTheDocument()
})
