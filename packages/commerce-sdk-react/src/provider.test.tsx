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

const sampleProps = {
    proxy: 'http://localhost:3000/mobify/proxy/api',
    clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
    organizationId: 'f_ecom_zzrf_001',
    shortCode: '8o7m175y',
    siteId: 'RefArchGlobal',
    locale: 'en_US',
    redirectURI: 'http://localhost:3000/callback',
    currency: 'USD',
}
const SampleProvider = (props: {children: React.ReactNode}) => {
    return <CommerceApiProvider {...sampleProps}>{props.children}</CommerceApiProvider>
}

test('useCommerceApi returns a set of api clients', () => {
    const Component = () => {
        const api = useCommerceApi()
        return <div>{api?.shopperSearch && 'success'}</div>
    }
    render(
        <SampleProvider>
            <Component />
        </SampleProvider>
    )

    expect(screen.getByText('success')).toBeInTheDocument()
})

test('props are used properly when initializing api clients', () => {
    const Component = () => {
        const api = useCommerceApi()
        return (
            <ul>
                <li>{api?.shopperSearch?.clientConfig?.parameters?.clientId}</li>
                <li>{api?.shopperSearch?.clientConfig?.parameters?.siteId}</li>
                <li>{api?.shopperSearch?.clientConfig?.parameters?.shortCode}</li>
                <li>{api?.shopperSearch?.clientConfig?.parameters?.organizationId}</li>
            </ul>
        )
    }
    render(
        <SampleProvider>
            <Component />
        </SampleProvider>
    )

    expect(screen.getByText(sampleProps.clientId)).toBeInTheDocument()
    expect(screen.getByText(sampleProps.siteId)).toBeInTheDocument()
    expect(screen.getByText(sampleProps.shortCode)).toBeInTheDocument()
    expect(screen.getByText(sampleProps.organizationId)).toBeInTheDocument()
})
