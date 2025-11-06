/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useForm} from 'react-hook-form'
import {useLocation} from 'react-router-dom'
import {useIntl, FormattedMessage} from 'react-intl'
import {
    Alert,
    Button,
    Container,
    Stack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {AlertIcon, BrandLogo} from '@salesforce/retail-react-app/app/components/icons'
import Field from '@salesforce/retail-react-app/app/components/field'
import PasswordRequirements from '@salesforce/retail-react-app/app/components/forms/password-requirements'
import useUpdatePasswordFields from '@salesforce/retail-react-app/app/components/forms/useUpdatePasswordFields'
import {usePasswordReset} from '@salesforce/retail-react-app/app/hooks/use-password-reset'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {
    API_ERROR_MESSAGE,
    INVALID_TOKEN_ERROR,
    INVALID_TOKEN_ERROR_MESSAGE
} from '@salesforce/retail-react-app/app/constants'

const ResetPasswordLanding = () => {
    const form = useForm()
    const {formatMessage} = useIntl()
    const {search} = useLocation()
    const navigate = useNavigation()
    const queryParams = new URLSearchParams(search)
    const email = decodeURIComponent(queryParams.get('email'))
    const token = decodeURIComponent(queryParams.get('token'))
    const fields = useUpdatePasswordFields({form})
    const password = form.watch('password')
    const {resetPassword} = usePasswordReset()

    const submit = async (values) => {
        form.clearErrors()
        try {
            await resetPassword({email, token, newPassword: values.password})
            navigate('/login')
        } catch (error) {
            const errorData = await error.response?.json()
            const message = INVALID_TOKEN_ERROR.test(errorData.message)
                ? formatMessage(INVALID_TOKEN_ERROR_MESSAGE)
                : formatMessage(API_ERROR_MESSAGE)
            form.setError('global', {type: 'manual', message})
        }
    }

    return (
        <Stack justify="center" align="center" spacing={6}>
            <BrandLogo width="60px" height="auto" />
            <Stack spacing={2}>
                <Text align="center" fontSize="xl" fontWeight="semibold">
                    <FormattedMessage
                        defaultMessage="Reset Password"
                        id="reset_password_form.title.reset_password"
                    />
                </Text>
            </Stack>
            <Container variant="form">
                <form onSubmit={form.handleSubmit(submit)}>
                    <Stack spacing={6} paddingLeft={4} paddingRight={4}>
                        {form.formState.errors?.global && (
                            <Alert data-testid="password-update-error" status="error">
                                <AlertIcon color="red.500" boxSize={4} />
                                <Text fontSize="sm" ml={3}>
                                    {form.formState.errors.global.message}
                                </Text>
                            </Alert>
                        )}
                        <Stack spacing={3} pb={2}>
                            <Field {...fields.password} />
                            <Field {...fields.confirmPassword} />
                            <PasswordRequirements value={password} />
                        </Stack>
                        <Button type="submit" isLoading={form.formState.isSubmitting}>
                            <FormattedMessage
                                defaultMessage="Reset Password"
                                id="reset_password_form.button.reset_password"
                            />
                        </Button>
                    </Stack>
                </form>
            </Container>
        </Stack>
    )
}

ResetPasswordLanding.getTemplateName = () => 'reset-password-landing'

ResetPasswordLanding.propTypes = {
    token: PropTypes.string
}

export default ResetPasswordLanding
