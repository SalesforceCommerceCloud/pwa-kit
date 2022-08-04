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

type NockBackOptions = {
    directory: string
    mode?: nock.BackMode
}
export const mockHttpResponses = (options: NockBackOptions) => {
    const nockBack = nock.back
    const mode = (process.env.NOCK_BACK_MODE as nock.BackMode) || options.mode || 'record'

    nockBack.fixtures = options.directory
    nockBack.setMode(mode)

    const withMocks = (testFn: () => Promise<void>) => {
        return async () => {
            const testName = expect.getState().currentTestName
            const fileName = `${slugify(testName)}.json`

            const {nockDone} = await nockBack(fileName)
            await testFn()
            nockDone()
        }
    }

    return {withMocks}
}

const slugify = (text: string) => {
    return text
        .toString()
        .toLowerCase()
        .replace(/\s+/g, '-')
        .replace(/[^\w-]+/g, '')
        .replace(/--+/g, '-')
        .replace(/^-+/, '')
        .replace(/-+$/, '')
}
