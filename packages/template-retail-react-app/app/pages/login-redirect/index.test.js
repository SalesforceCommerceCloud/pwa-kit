/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {renderWithReactIntl} from '@salesforce/retail-react-app/app/utils/test-utils'
import LoginRedirect from '@salesforce/retail-react-app/app/pages/login-redirect/index'
import {TRUSTED_AGENT_POPUP_MESSAGE_TYPE} from '@salesforce/commerce-sdk-react'

const setSearch = (search) => {
    const url = new URL(window.location.href)
    url.search = search
    window.history.replaceState({}, '', url.toString())
}

describe('Login Redirect', () => {
    let originalOpener

    beforeEach(() => {
        originalOpener = window.opener
    })

    afterEach(() => {
        setSearch('')
        Object.defineProperty(window, 'opener', {value: originalOpener, configurable: true})
        jest.restoreAllMocks()
    })

    test('renders without errors', () => {
        const {getByRole} = renderWithReactIntl(<LoginRedirect />)

        expect(getByRole('heading', {name: /login redirect/i})).toBeInTheDocument()
        expect(typeof LoginRedirect.getTemplateName()).toBe('string')
    })

    test('posts trusted-agent {code, state} to the opener when present in the URL', () => {
        const postMessage = jest.fn()
        Object.defineProperty(window, 'opener', {value: {postMessage}, configurable: true})
        setSearch('?code=auth_code_123&state=state_abc')

        renderWithReactIntl(<LoginRedirect />)

        expect(postMessage).toHaveBeenCalledWith(
            {
                type: TRUSTED_AGENT_POPUP_MESSAGE_TYPE,
                code: 'auth_code_123',
                state: 'state_abc'
            },
            window.location.origin
        )
    })

    test('does not post to the opener when code/state are absent', () => {
        const postMessage = jest.fn()
        Object.defineProperty(window, 'opener', {value: {postMessage}, configurable: true})
        setSearch('')

        renderWithReactIntl(<LoginRedirect />)

        expect(postMessage).not.toHaveBeenCalled()
    })
})
