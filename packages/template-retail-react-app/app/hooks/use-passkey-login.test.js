/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {rest} from 'msw'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {
    renderWithProviders,
    registerUserToken
} from '@salesforce/retail-react-app/app/utils/test-utils'
import {usePasskeyLogin} from '@salesforce/retail-react-app/app/hooks/use-passkey-login'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const mockCredential = {
    id: 'test-credential-id',
    rawId: new ArrayBuffer(8),
    type: 'public-key',
    getClientExtensionResults: () => ({}),
    toJSON: () => ({
        id: 'test-credential-id',
        rawId: 'AAAAAAAAAAA',
        type: 'public-key',
        clientExtensionResults: {},
        response: {
            authenticatorData: 'AAAAAAAAAAA',
            clientDataJSON: 'AAAAAAAAAAA',
            signature: 'AAAAAAAAAAA',
            userHandle: 'AAAAAAAAAAA'
        }
    }),
    response: {
        authenticatorData: new ArrayBuffer(8),
        clientDataJSON: new ArrayBuffer(8),
        signature: new ArrayBuffer(8),
        userHandle: new ArrayBuffer(8)
    }
}

const mockStartWebauthnAuthenticationResponse = {
    publicKey: {
        challenge: 'DZdUeRgEm5m1D8Fqp8pzZZesdHkf1Pqoe-MqCA8gVw8',
        timeout: 60000,
        rpId: 'localhost',
        allowCredentials: [
            {
                id: 'test-credential-id',
                type: 'public-key',
                transports: []
            }
        ]
    }
}

const mockFinishWebauthnAuthenticationResponse = {
    tokenResponse: {
        access_token: registerUserToken,
        customer_id: 'customerid',
        refresh_token: 'testrefeshtoken',
        usid: 'testusid',
        enc_user_id: 'testEncUserId',
        id_token: 'testIdToken'
    }
}

// Mock getConfig to enable passkey
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

// Mock WebAuthn APIs
const mockGetCredentials = jest.fn()

// Mock PublicKeyCredential static methods
const mockIsConditionalMediationAvailable = jest.fn()
const mockParseRequestOptionsFromJSON = jest.fn()

const MockComponent = () => {
    const {loginWithPasskey, abortPasskeyLogin} = usePasskeyLogin()
    const [result, setResult] = React.useState(null)

    const handleLogin = () => {
        loginWithPasskey()
            .then(() => setResult('resolved'))
            .catch(() => setResult('rejected'))
    }
    const handleAbort = () => {
        abortPasskeyLogin()
    }
    return (
        <div>
            <button data-testid="login-with-passkey" onClick={handleLogin} />
            <button data-testid="abort-passkey-login" onClick={handleAbort} />
            {result && <span data-testid="login-result">{result}</span>}
        </div>
    )
}

describe('usePasskeyLogin', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        global.server.use(
            rest.post('*/oauth2/webauthn/authenticate/start', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.status(200),
                    ctx.json(mockStartWebauthnAuthenticationResponse)
                )
            }),
            rest.post('*/oauth2/webauthn/authenticate/finish', (req, res, ctx) => {
                return res(
                    ctx.delay(0),
                    ctx.status(200),
                    ctx.json(mockFinishWebauthnAuthenticationResponse)
                )
            })
        )

        getConfig.mockReturnValue(mockConfig)

        // Mock PublicKeyCredential with static methods
        const mockPublicKeyCredential = {
            isConditionalMediationAvailable: mockIsConditionalMediationAvailable,
            parseRequestOptionsFromJSON: mockParseRequestOptionsFromJSON
        }
        global.window.PublicKeyCredential = mockPublicKeyCredential
        global.PublicKeyCredential = mockPublicKeyCredential

        // Default mock implementations for PublicKeyCredential static methods
        mockIsConditionalMediationAvailable.mockResolvedValue(true)
        // parseRequestOptionsFromJSON should return parsed options, not a credential
        mockParseRequestOptionsFromJSON.mockReturnValue({
            challenge: mockStartWebauthnAuthenticationResponse.publicKey.challenge,
            timeout: mockStartWebauthnAuthenticationResponse.publicKey.timeout,
            rpId: mockStartWebauthnAuthenticationResponse.publicKey.rpId
        })

        // Mock navigator.credentials.get
        global.navigator.credentials = {
            get: mockGetCredentials
        }

        // Mock navigator.credentials.get to return a mock credential
        mockGetCredentials.mockResolvedValue(mockCredential)
    })

    describe('loginWithPasskey', () => {
        test('calls navigator.credentials.get with the correct parameters when all conditions are met', async () => {
            renderWithProviders(<MockComponent />)

            const trigger = screen.getByTestId('login-with-passkey')
            fireEvent.click(trigger)

            // Check that credentials.get is called with the correct parameters
            await waitFor(() => {
                expect(mockGetCredentials).toHaveBeenCalledWith({
                    publicKey: expect.objectContaining({
                        challenge: expect.any(String),
                        timeout: expect.any(Number),
                        rpId: expect.any(String)
                    }),
                    mediation: 'conditional',
                    signal: expect.any(AbortSignal)
                })
            })
        })

        test('does not call navigator.credentials.get when passkey is not enabled', async () => {
            getConfig.mockReturnValue({
                ...mockConfig,
                app: {
                    ...mockConfig.app,
                    login: {
                        ...mockConfig.app.login,
                        passkey: {
                            enabled: false
                        }
                    }
                }
            })

            renderWithProviders(<MockComponent />)

            const trigger = screen.getByTestId('login-with-passkey')
            fireEvent.click(trigger)

            expect(mockGetCredentials).not.toHaveBeenCalled()
        })

        test('does not start passkey login when PublicKeyCredential is not available', async () => {
            delete global.window.PublicKeyCredential

            renderWithProviders(<MockComponent />)

            const trigger = screen.getByTestId('login-with-passkey')
            fireEvent.click(trigger)

            expect(mockGetCredentials).not.toHaveBeenCalled()
        })

        test('does not start passkey login when conditional mediation is not available', async () => {
            mockIsConditionalMediationAvailable.mockResolvedValue(false)

            renderWithProviders(<MockComponent />)

            const trigger = screen.getByTestId('login-with-passkey')
            fireEvent.click(trigger)

            await waitFor(() => {
                expect(mockIsConditionalMediationAvailable).toHaveBeenCalled()
            })

            expect(mockGetCredentials).not.toHaveBeenCalled()
        })

        test('falls back to manual encoding when toJSON() is not supported', async () => {
            // Create a credential mock where toJSON() throws an error (e.g., 1Password)
            const credentialWithoutToJSON = {
                ...mockCredential,
                toJSON: jest.fn(() => {
                    throw new Error('toJSON is not supported')
                })
            }

            // Reset and set the mock for this specific test to ensure it returns the credential
            mockGetCredentials.mockResolvedValue(credentialWithoutToJSON)

            global.server.use(
                rest.post('*/oauth2/webauthn/authenticate/start', (req, res, ctx) => {
                    return res(
                        ctx.delay(0),
                        ctx.status(200),
                        ctx.json(mockStartWebauthnAuthenticationResponse)
                    )
                }),
                rest.post('*/oauth2/webauthn/authenticate/finish', async (req, res, ctx) => {
                    const body = await req.json()
                    // Assert: credential is still manually encoded when toJSON() is not supported
                    expect(body).toEqual(
                        expect.objectContaining({
                            credential: expect.objectContaining({
                                id: 'test-credential-id',
                                rawId: expect.any(String),
                                type: 'public-key',
                                clientExtensionResults: {},
                                response: expect.objectContaining({
                                    authenticatorData: expect.any(String),
                                    clientDataJSON: expect.any(String),
                                    signature: expect.any(String),
                                    userHandle: expect.any(String)
                                })
                            }),
                            // usid used in the test environment
                            usid: '8e883973-68eb-41fe-a3c5-756232652ff5'
                        })
                    )
                    return res(
                        ctx.delay(0),
                        ctx.status(200),
                        ctx.json(mockFinishWebauthnAuthenticationResponse)
                    )
                })
            )

            renderWithProviders(<MockComponent />)

            const trigger = screen.getByTestId('login-with-passkey')
            fireEvent.click(trigger)

            await waitFor(() => {
                expect(mockGetCredentials).toHaveBeenCalled()
            })
        })

        test.each(['NotAllowedError', 'AbortError'])(
            'returns early without error when %s is thrown from navigator.credentials.get',
            async (errorName) => {
                const error = new Error()
                error.name = errorName
                mockGetCredentials.mockRejectedValue(error)

                renderWithProviders(<MockComponent />)

                const trigger = screen.getByTestId('login-with-passkey')
                fireEvent.click(trigger)

                await waitFor(() => expect(mockGetCredentials).toHaveBeenCalled())
                await waitFor(() =>
                    expect(screen.getByTestId('login-result')).toHaveTextContent('resolved')
                )
            }
        )

        test('returns early without error when 412 is returned from startWebauthnAuthentication', async () => {
            global.server.use(
                rest.post('*/oauth2/webauthn/authenticate/start', (req, res, ctx) => {
                    return res(
                        ctx.delay(0),
                        ctx.status(412),
                        ctx.json({message: 'Authenticate not started for: user@example.com"'})
                    )
                })
            )

            renderWithProviders(<MockComponent />)

            const trigger = screen.getByTestId('login-with-passkey')
            fireEvent.click(trigger)

            expect(mockGetCredentials).not.toHaveBeenCalled()
            await waitFor(() =>
                expect(screen.getByTestId('login-result')).toHaveTextContent('resolved')
            )
        })

        test('throws error when other error is returned from startWebauthnAuthentication', async () => {
            global.server.use(
                rest.post('*/oauth2/webauthn/authenticate/start', (req, res, ctx) => {
                    return res(ctx.delay(0), ctx.status(500), ctx.json({message: '500 Error'}))
                })
            )

            renderWithProviders(<MockComponent />)

            const trigger = screen.getByTestId('login-with-passkey')
            fireEvent.click(trigger)

            await waitFor(() =>
                expect(screen.getByTestId('login-result')).toHaveTextContent('rejected')
            )
        })

        test('throws error when other error is returned from finishWebauthnAuthentication', async () => {
            global.server.use(
                rest.post('*/oauth2/webauthn/authenticate/finish', (req, res, ctx) => {
                    return res(ctx.delay(0), ctx.status(500), ctx.json({message: '500 Error'}))
                })
            )

            renderWithProviders(<MockComponent />)

            const trigger = screen.getByTestId('login-with-passkey')
            fireEvent.click(trigger)

            await waitFor(() =>
                expect(screen.getByTestId('login-result')).toHaveTextContent('rejected')
            )
        })

        test('throws error when other error is returned from navigator.credentials.get', async () => {
            const networkError = new Error('NetworkError')
            networkError.name = 'NetworkError'
            mockGetCredentials.mockRejectedValue(networkError)

            renderWithProviders(<MockComponent />)

            const trigger = screen.getByTestId('login-with-passkey')
            fireEvent.click(trigger)

            await waitFor(() =>
                expect(screen.getByTestId('login-result')).toHaveTextContent('rejected')
            )
        })
    })

    describe('abortPasskeyLogin', () => {
        test('aborts the pending passkey request', async () => {
            // Return a promise that rejects with AbortError when the abort signal fires
            mockGetCredentials.mockImplementation(({signal}) => {
                return new Promise((resolve, reject) => {
                    signal.addEventListener('abort', () => {
                        const abortError = new Error('Aborted')
                        abortError.name = 'AbortError'
                        reject(abortError)
                    })
                })
            })

            renderWithProviders(<MockComponent />)

            const loginTrigger = screen.getByTestId('login-with-passkey')
            fireEvent.click(loginTrigger)

            // Wait for credentials.get to be called (passkey prompt is "waiting")
            await waitFor(() => expect(mockGetCredentials).toHaveBeenCalled())

            // Abort while navigator.credentials.get is pending
            const abortTrigger = screen.getByTestId('abort-passkey-login')
            fireEvent.click(abortTrigger)

            // Hook catches AbortError and returns, so loginWithPasskey resolves
            await waitFor(() =>
                expect(screen.getByTestId('login-result')).toHaveTextContent('resolved')
            )
        })
    })
})
