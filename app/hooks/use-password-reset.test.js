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

const mockEmail = 'test@email.com'
const mockToken = '123456'
const mockNewPassword = 'new-password'

const MockComponent = () => {
    const {getPasswordResetToken, resetPassword} = usePasswordReset()

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
        </div>
    )
}

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
                callback_uri: 'https://www.domain.com/reset-password-callback'
            })
        })
    })

    test('resetPassword sends expected api request', async () => {
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
                expect.anything()
            )
        })
    })
})
