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
import {usePasswordReset} from '@salesforce/retail-react-app/app/hooks/use-password-reset'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import mockConfig from '@salesforce/retail-react-app/config/mocks/default'

const mockEmail = 'test@email.com'
const mockToken = '123456'
const mockNewPassword = 'new-password'

const MockComponent = () => {
    const {getPasswordResetToken, resetPassword, resetPasswordLandingPath} = usePasswordReset()
    return (
        <div>
            <button
                data-testid="get-password-reset-token"
                onClick={() => getPasswordResetToken(mockEmail)}
            />
            <button
                data-testid="reset-password"
                onClick={() =>
                    resetPassword({
                        email: mockEmail,
                        token: mockToken,
                        newPassword: mockNewPassword
                    })
                }
            />

            <div data-testid="reset-password-landing-path">{resetPasswordLandingPath}</div>
        </div>
    )
}

const mockShowToast = jest.fn()
jest.mock('@salesforce/retail-react-app/app/hooks/use-toast', () => ({
    useToast: jest.fn(() => mockShowToast)
}))

jest.mock('@salesforce/pwa-kit-runtime/utils/ssr-config', () => ({
    getConfig: jest.fn()
}))

jest.mock('@salesforce/commerce-sdk-react', () => {
    const originalModule = jest.requireActual('@salesforce/commerce-sdk-react')
    return {
        ...originalModule,
        useAuthHelper: jest.fn()
    }
})

const getPasswordResetToken = {mutateAsync: jest.fn()}
const resetPassword = {mutateAsync: jest.fn()}
useAuthHelper.mockImplementation((param) => {
    if (param === AuthHelpers.ResetPassword) {
        return resetPassword
    } else if (param === AuthHelpers.GetPasswordResetToken) {
        return getPasswordResetToken
    }
})

beforeEach(() => {
    jest.clearAllMocks()
    getConfig.mockImplementation(() => mockConfig)
})

afterEach(() => {
    jest.clearAllMocks()
})

describe('usePasswordReset', () => {
    test('getPasswordResetToken sends expected api request', async () => {
        renderWithProviders(<MockComponent />)

        const trigger = screen.getByTestId('get-password-reset-token')
        await fireEvent.click(trigger)
        await waitFor(() => {
            expect(getPasswordResetToken.mutateAsync).toHaveBeenCalled()
            expect(getPasswordResetToken.mutateAsync).toHaveBeenCalledWith({
                user_id: mockEmail,
                mode: mockConfig.app.login.resetPassword.mode,
                callback_uri: mockConfig.app.login.resetPassword.callbackURI,
                locale: 'en-GB'
            })
        })
    })

    test('getPasswordResetToken sends expected api request when callback_uri is defined', async () => {
        const mockCallbackURI = 'https://www.example.com/reset-password-callback'
        const mockMode = 'callback'
        getConfig.mockImplementation(() => ({
            ...mockConfig,
            app: {
                ...mockConfig.app,
                login: {
                    ...mockConfig.app.login,
                    resetPassword: {
                        ...mockConfig.app.login.resetPassword,
                        mode: mockMode,
                        callbackURI: mockCallbackURI
                    }
                }
            }
        }))
        renderWithProviders(<MockComponent />)

        const trigger = screen.getByTestId('get-password-reset-token')
        await fireEvent.click(trigger)
        await waitFor(() => {
            expect(getPasswordResetToken.mutateAsync).toHaveBeenCalled()
            expect(getPasswordResetToken.mutateAsync).toHaveBeenCalledWith({
                user_id: mockEmail,
                mode: mockMode,
                callback_uri: mockCallbackURI,
                locale: 'en-GB'
            })
        })
    })

    test('resetPassword sends expected api request', async () => {
        resetPassword.mutateAsync.mockResolvedValue({})

        renderWithProviders(<MockComponent />)

        const trigger = screen.getByTestId('reset-password')
        await fireEvent.click(trigger)
        await waitFor(() => {
            expect(resetPassword.mutateAsync).toHaveBeenCalled()
            expect(resetPassword.mutateAsync).toHaveBeenCalledWith(
                expect.objectContaining({
                    pwd_action_token: mockToken,
                    new_password: mockNewPassword,
                    user_id: mockEmail
                }),
                expect.objectContaining({
                    onSuccess: expect.any(Function)
                })
            )
        })

        // Verify onSuccess callback shows toast
        const onSuccessCallback = resetPassword.mutateAsync.mock.calls[0][1].onSuccess
        onSuccessCallback()
        expect(mockShowToast).toHaveBeenCalledWith({
            title: 'Password Reset Success',
            status: 'success',
            position: 'bottom-right'
        })
    })

    test('resetPasswordLandingPath is returned', () => {
        renderWithProviders(<MockComponent />)
        expect(screen.getByTestId('reset-password-landing-path')).toHaveTextContent(
            mockConfig.app.login.resetPassword.landingPath
        )
    })
})
