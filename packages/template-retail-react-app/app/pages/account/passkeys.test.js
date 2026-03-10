/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Route, Switch} from 'react-router-dom'
import {screen, waitFor, act} from '@testing-library/react'
import {rest} from 'msw'
import {
    createPathWithDefaults,
    renderWithProviders
} from '@salesforce/retail-react-app/app/utils/test-utils'
import AccountPasskeys from '@salesforce/retail-react-app/app/pages/account/passkeys'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {
    PasskeyRegistrationContext
} from '@salesforce/retail-react-app/app/contexts/passkey-registration-provider'

const MockedComponent = () => {
    return (
        <Switch>
            <Route path={createPathWithDefaults('/account/passkeys')}>
                <AccountPasskeys />
            </Route>
        </Switch>
    )
}

beforeEach(() => {
    window.history.pushState({}, 'Account Passkeys', createPathWithDefaults('/account/passkeys'))
})

const mockPasskeyUser = {
    id: 26,
    userName: 'customer@test.com',
    displayName: 'Test User',
    userHandle: 'abc123',
    slasUserId: 10000,
    credentials: [
        {
            id: 21,
            userId: 26,
            credentialId: 'cred-1',
            nickName: 'Millenium Falcon',
            userHandle: 'abc123',
            signatureCount: '1'
        },
        {
            id: 22,
            userId: 26,
            credentialId: 'cred-2',
            nickName: 'Millenium Eagle',
            userHandle: 'abc123',
            signatureCount: '5'
        }
    ]
}

test('renders a list of registered passkeys', async () => {
    global.server.use(
        rest.get('*/oauth2/webauthn/passkey/user/:loginId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(200), ctx.json(mockPasskeyUser))
        })
    )

    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    expect(await screen.findByText('Your Registered Passkeys')).toBeInTheDocument()
    expect(await screen.findByText('Register New Passkey')).toBeInTheDocument()

    await waitFor(() => {
        expect(screen.getByText('Millenium Falcon')).toBeInTheDocument()
        expect(screen.getByText('Millenium Eagle')).toBeInTheDocument()
    })
})

test('renders passkeys in alphabetical order by nickname', async () => {
    global.server.use(
        rest.get('*/oauth2/webauthn/passkey/user/:loginId', (req, res, ctx) => {
            return res(
                ctx.delay(0),
                ctx.status(200),
                ctx.json({
                    ...mockPasskeyUser,
                    credentials: [
                        {id: 1, credentialId: 'cred-z', nickName: 'Zebra Key'},
                        {id: 2, credentialId: 'cred-a', nickName: 'Alpha Key'},
                        {id: 3, credentialId: 'cred-m', nickName: 'Middle Key'}
                    ]
                })
            )
        })
    )

    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    await waitFor(() => {
        const headings = screen.getAllByRole('heading', {level: 3})
        expect(headings[0]).toHaveTextContent('Alpha Key')
        expect(headings[1]).toHaveTextContent('Middle Key')
        expect(headings[2]).toHaveTextContent('Zebra Key')
    })
})

test('renders empty state when there are no passkeys', async () => {
    global.server.use(
        rest.get('*/oauth2/webauthn/passkey/user/:loginId', (req, res, ctx) => {
            return res(
                ctx.delay(0),
                ctx.status(200),
                ctx.json({...mockPasskeyUser, credentials: []})
            )
        })
    )

    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    expect(
        await screen.findByText("You don't have any registered passkeys yet.")
    ).toBeInTheDocument()
})

test('renders error state when fetch fails', async () => {
    global.server.use(
        rest.get('*/oauth2/webauthn/passkey/user/:loginId', (req, res, ctx) => {
            return res(ctx.delay(0), ctx.status(500))
        })
    )

    renderWithProviders(<MockedComponent />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    expect(
        await screen.findByText('Unable to load passkeys. Please try again.')
    ).toBeInTheDocument()
    expect(screen.getByRole('button', {name: 'Retry'})).toBeInTheDocument()
})

test('refreshes passkey list after successful registration via onSuccess callback', async () => {
    let callCount = 0
    global.server.use(
        rest.get('*/oauth2/webauthn/passkey/user/:loginId', (req, res, ctx) => {
            callCount++
            const credentials =
                callCount === 1
                    ? mockPasskeyUser.credentials
                    : [
                          ...mockPasskeyUser.credentials,
                          {id: 99, credentialId: 'cred-new', nickName: 'New Passkey'}
                      ]
            return res(ctx.delay(0), ctx.status(200), ctx.json({...mockPasskeyUser, credentials}))
        })
    )

    let capturedSetOnSuccess = null
    const MockedComponentWithSuccessCapture = () => {
        const ctx = React.useContext(PasskeyRegistrationContext)
        React.useEffect(() => {
            if (ctx?.passkeyModal?.setOnSuccess) {
                const original = ctx.passkeyModal.setOnSuccess
                ctx.passkeyModal.setOnSuccess = (fn) => {
                    capturedSetOnSuccess = fn
                    original(fn)
                }
            }
        }, [ctx])
        return (
            <Switch>
                <Route path={createPathWithDefaults('/account/passkeys')}>
                    <AccountPasskeys />
                </Route>
            </Switch>
        )
    }

    renderWithProviders(<MockedComponentWithSuccessCapture />, {
        wrapperProps: {siteAlias: 'uk', appConfig: mockConfig.app}
    })

    // Wait for initial load
    await waitFor(() => {
        expect(screen.getByText('Millenium Falcon')).toBeInTheDocument()
    })

    // Simulate successful passkey registration by triggering onSuccess
    await act(async () => {
        capturedSetOnSuccess?.()
    })

    // The list should refresh and show the new passkey
    await waitFor(() => {
        expect(screen.getByText('New Passkey')).toBeInTheDocument()
    })
})

