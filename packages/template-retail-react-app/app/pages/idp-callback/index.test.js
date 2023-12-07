/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import {screen} from '@testing-library/react'
import Account from '@salesforce/retail-react-app/app/pages/account'
import {
    renderWithProviders,
    createPathWithDefaults
} from '@salesforce/retail-react-app/app/utils/test-utils'
import IDPCallback from '@salesforce/retail-react-app/app/pages/idp-callback'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

import {useSearchParams} from '@salesforce/retail-react-app/app/hooks/use-search-params'
import useIdpAuth from '@salesforce/retail-react-app/app/hooks/use-idp-auth'

jest.setTimeout(60000)

jest.mock('@salesforce/retail-react-app/app/hooks/use-search-params')
jest.mock('@salesforce/retail-react-app/app/hooks/use-idp-auth')
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer', () => {
    return {
        useCurrentCustomer: () => ({
            data: {
                isRegistered: true,
                email: 'test@test.com'
            }
        })
    }
})

const MockedComponent = () => {
    const match = {
        params: {pageName: 'profile'}
    }
    return (
        <Router>
            <IDPCallback />
            <Route path={createPathWithDefaults('/account')}>
                <Account match={match} />
            </Route>
        </Router>
    )
}

describe('IDP Callback', () => {
    beforeEach(() => {
        useSearchParams.mockReset()
        useIdpAuth.mockReset()
    })

    describe.each([
        [{usid: 'usid', code: 'code'}, 'Authenticating'],
        [{}, 'Missing parameters'],
        [{error_description: 'Random error'}, 'Random error']
    ])('when search params are %p', (searchParams, expectedText) => {
        test(`should show "${expectedText}"`, async () => {
            useSearchParams.mockReturnValue([searchParams])
            useIdpAuth.mockImplementation(() => ({
                processIdpResult: () => new Promise(() => {})
            }))

            renderWithProviders(<MockedComponent />, {
                wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}, appConfig: mockConfig.app}
            })

            expect(await screen.findByText(expectedText, {}, {timeout: 30000})).toBeInTheDocument()
        })
    })

    test('should show an error if the hook throws an error', async () => {
        useSearchParams.mockReturnValue([{usid: 'usid', code: 'code'}])

        useIdpAuth.mockImplementation(() => ({
            processIdpResult: () => Promise.reject({message: 'Something happened'})
        }))

        renderWithProviders(<MockedComponent />, {
            wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}, appConfig: mockConfig.app}
        })

        expect(
            await screen.findByText(/Something happened/i, {}, {timeout: 30000})
        ).toBeInTheDocument()
    })

    test('should navigate to account page when account is logged in', async () => {
        useSearchParams.mockReturnValue([{usid: 'usid', code: 'code'}])

        useIdpAuth.mockImplementation(() => ({
            processIdpResult: () => Promise.resolve()
        }))

        renderWithProviders(<MockedComponent />, {
            wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}, appConfig: mockConfig.app}
        })

        expect(await screen.findByText(/test@test.com/i, {}, {timeout: 30000})).toBeInTheDocument()
    })
})
