/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithReactIntl} from '@salesforce/retail-react-app/app/utils/test-utils'
import LoginRedirect from '@salesforce/retail-react-app/app/pages/login-redirect/index'

// The Trusted Agent callback delivery lives in the SDK hook
// `useTrustedAgentPopupCallback`; this page just mounts it. We assert the page
// wires the hook up. The delivery behaviour itself is covered by the hook's own
// tests in commerce-sdk-react.
const mockUseTrustedAgentPopupCallback = jest.fn()
jest.mock('@salesforce/commerce-sdk-react', () => ({
    ...jest.requireActual('@salesforce/commerce-sdk-react'),
    useTrustedAgentPopupCallback: () => mockUseTrustedAgentPopupCallback()
}))

describe('Login Redirect', () => {
    afterEach(() => {
        jest.clearAllMocks()
    })

    test('renders without errors', () => {
        const {getByRole} = renderWithReactIntl(<LoginRedirect />)

        expect(getByRole('heading', {name: /login redirect/i})).toBeInTheDocument()
        expect(typeof LoginRedirect.getTemplateName()).toBe('string')
    })

    test('mounts the trusted-agent callback hook', () => {
        renderWithReactIntl(<LoginRedirect />)

        expect(mockUseTrustedAgentPopupCallback).toHaveBeenCalled()
    })
})
