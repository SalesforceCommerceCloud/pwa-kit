/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {BrowserRouter as Router, Route} from 'react-router-dom'
import {screen} from '@testing-library/react'
import {
    renderWithProviders,
    createPathWithDefaults
} from '@salesforce/retail-react-app/app/utils/test-utils'
import IDPCallback from '@salesforce/retail-react-app/app/pages/idp-callback'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import useIdpCallback from '@salesforce/retail-react-app/app/hooks/use-idp-callback'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'

jest.setTimeout(60000)

jest.mock('@salesforce/retail-react-app/app/hooks/use-idp-callback')
jest.mock('@salesforce/retail-react-app/app/hooks/use-current-customer')

const MockedComponent = () => {
    const match = {
        params: {pageName: 'profile'}
    }
    return (
        <Router>
            <IDPCallback />
            <Route path={createPathWithDefaults('/account')}>
                <div>test@test.com</div>
            </Route>
        </Router>
    )
}

describe('IDP Callback', () => {
    beforeEach(() => {
        useIdpCallback.mockReset()
        useCurrentCustomer.mockReset()
    })

    describe.each([
        [{}, 'Missing parameters'],
        [{error_description: 'Random error'}, 'Random error']
    ])('when search params are %p', (searchParams, expectedText) => {
        test(`should show "${expectedText}"`, async () => {
            useCurrentCustomer.mockReturnValue({
                data: {
                    isRegistered: false
                }
            })
            useIdpCallback.mockReturnValue({authenticationError: expectedText})

            renderWithProviders(<MockedComponent />, {
                wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}, appConfig: mockConfig.app}
            })

            expect(await screen.findByText(expectedText, {}, {timeout: 30000})).toBeInTheDocument()
        })
    })

    test('should navigate to account page when account is logged in', async () => {
        useCurrentCustomer.mockReturnValue({
            data: {
                isRegistered: true
            }
        })
        useIdpCallback.mockReturnValue({authenticationError: null})

        renderWithProviders(<MockedComponent />, {
            wrapperProps: {siteAlias: 'uk', locale: {id: 'en-GB'}, appConfig: mockConfig.app}
        })

        expect(await screen.findByText(/test@test.com/i, {}, {timeout: 30000})).toBeInTheDocument()
    })
})
