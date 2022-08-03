/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {render, RenderOptions} from '@testing-library/react'
import nock from 'nock'
import React from 'react'
import CommerceApiProvider from './provider'

const sampleProps = {
    proxy: 'http://localhost:3000/mobify/proxy/api',
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

const recordHttpResponses = (pathToFixturesDirectory: string): nock.Back => {
    const nockBack = nock.back
    nockBack.fixtures = pathToFixturesDirectory
    nockBack.setMode('record')

    return nockBack
}

export const recordHookResponses = (): nock.Back =>
    recordHttpResponses(`${__dirname}/hooks/mock-responses`)
