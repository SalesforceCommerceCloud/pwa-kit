/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {AuthHelpers, useAuthHelper} from '@salesforce/commerce-sdk-react'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useIntl} from 'react-intl'
import {useAppOrigin} from '@salesforce/retail-react-app/app/hooks/use-app-origin'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {isAbsoluteURL} from '@salesforce/retail-react-app/app/page-designer/utils'

/**
 * This hook provides commerce-react-sdk hooks to simplify the reset password flow.
 */
export const usePasswordReset = () => {
    const showToast = useToast()
    const {formatMessage} = useIntl()
    const appOrigin = useAppOrigin()
    const config = getConfig()
    const resetPasswordCallback =
        config.app.login?.resetPassword?.callbackURI || '/reset-password-callback'
    const callbackURI = isAbsoluteURL(resetPasswordCallback)
        ? resetPasswordCallback
        : `${appOrigin}${resetPasswordCallback}`

    const getPasswordResetTokenMutation = useAuthHelper(AuthHelpers.GetPasswordResetToken)
    const resetPasswordMutation = useAuthHelper(AuthHelpers.ResetPassword)

    const getPasswordResetToken = async (email) => {
        await getPasswordResetTokenMutation.mutateAsync({
            user_id: email,
            callback_uri: callbackURI
        })
    }

    const resetPassword = async ({email, token, newPassword}) => {
        await resetPasswordMutation.mutateAsync(
            {user_id: email, pwd_action_token: token, new_password: newPassword},
            {
                onSuccess: () => {
                    showToast({
                        title: formatMessage({
                            defaultMessage: 'Password Reset Success',
                            id: 'password_reset_success.toast'
                        }),
                        status: 'success',
                        position: 'bottom-right'
                    })
                }
            }
        )
    }

    return {getPasswordResetToken, resetPassword}
}
