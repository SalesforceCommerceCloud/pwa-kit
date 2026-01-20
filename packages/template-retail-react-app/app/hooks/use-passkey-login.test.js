/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {fireEvent, screen, waitFor} from '@testing-library/react'
import {useAuthHelper, AuthHelpers} from '@salesforce/commerce-sdk-react'
import {renderWithProviders} from '@salesforce/retail-react-app/app/utils/test-utils'
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
        access_token: 'test-access-token',
        customer_id: 'test-customer-id',
        refresh_token: 'test-refresh-token',
        usid: 'test-usid'
    }
}

// Mock getConfig to enable passkey
jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

// Mock commerce-sdk-react
jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useAuthHelper: jest.fn()
    }
})

// Mock WebAuthn APIs
const mockGetCredentials = jest.fn()
// Mock PublicKeyCredential static methods
const mockIsConditionalMediationAvailable = jest.fn()
const mockParseRequestOptionsFromJSON = jest.fn()

const startWebauthnAuthentication = {mutateAsync: jest.fn()}
const finishWebauthnAuthentication = {mutateAsync: jest.fn()}

useAuthHelper.mockImplementation((param) => {
    if (param === AuthHelpers.StartWebauthnAuthentication) {
        return startWebauthnAuthentication
    } else if (param === AuthHelpers.FinishWebauthnAuthentication) {
        return finishWebauthnAuthentication
    }
})

const MockComponent = () => {
    const {loginWithPasskey} = usePasskeyLogin()
    return (
        <div>
            <button data-testid="login-with-passkey" onClick={() => loginWithPasskey()} />
        </div>
    )
}

describe('usePasskeyLogin', () => {
    beforeEach(() => {
        jest.clearAllMocks()

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

        startWebauthnAuthentication.mutateAsync.mockResolvedValue(
            mockStartWebauthnAuthenticationResponse
        )

        finishWebauthnAuthentication.mutateAsync.mockResolvedValue(
            mockFinishWebauthnAuthenticationResponse
        )
    })

    test('calls webauthn authenticate start and finish endpoints when all conditions are met', async () => {
        renderWithProviders(<MockComponent />)

        const trigger = screen.getByTestId('login-with-passkey')
        fireEvent.click(trigger)

        await waitFor(() => {
            expect(startWebauthnAuthentication.mutateAsync).toHaveBeenCalledWith({})
            expect(mockGetCredentials).toHaveBeenCalled()
            expect(finishWebauthnAuthentication.mutateAsync).toHaveBeenCalledWith(
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
                    })
                })
            )
        })
    })

    test('does not call startWebauthnAuthentication API when passkey is not enabled', async () => {
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

        expect(startWebauthnAuthentication.mutateAsync).not.toHaveBeenCalled()
    })

    test('does not start passkey login when PublicKeyCredential is not available', async () => {
        delete global.window.PublicKeyCredential

        renderWithProviders(<MockComponent />)

        const trigger = screen.getByTestId('login-with-passkey')
        fireEvent.click(trigger)

        expect(startWebauthnAuthentication.mutateAsync).not.toHaveBeenCalled()
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

        expect(startWebauthnAuthentication.mutateAsync).not.toHaveBeenCalled()
        expect(mockGetCredentials).not.toHaveBeenCalled()
    })
})
