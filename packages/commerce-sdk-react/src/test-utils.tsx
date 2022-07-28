/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {render, RenderOptions} from '@testing-library/react'
import {RequestHandler} from 'msw'
import {setupServer, SetupServerApi} from 'msw/lib/node'
import React from 'react'
import CommerceApiProvider from './provider'

const sampleProps = {
    proxy: '/proxy',
    clientId: 'c9c45bfd-0ed3-4aa2-9971-40f88962b836',
    organizationId: 'f_ecom_zzrf_001',
    shortCode: '8o7m175y',
    siteId: 'RefArchGlobal',
    locale: 'en_US',
    currency: 'USD'
}

const TestProviders = (props: {children: React.ReactNode}) => {
    return <CommerceApiProvider {...sampleProps}>{props.children}</CommerceApiProvider>
}

export const renderWithProviders = (
    ui: React.ReactElement,
    options?: Omit<RenderOptions, 'wrapper'>
): void => {
    render(ui, {wrapper: TestProviders, ...options})
}

export const setupMockServer = (...handlers: RequestHandler[]): SetupServerApi => {
    return setupServer(
        ...handlers
        // TODO: Add handlers to mock the API responses for SLAS login flow
        // (see `setupMockServer` in template-retail-react-app/app/utils/test-utils.js)
    )
}
