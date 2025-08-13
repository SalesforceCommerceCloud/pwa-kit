/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {useForm} from 'react-hook-form'
import {useLocation} from 'react-router-dom'
import {useIntl} from 'react-intl'
import {Alert, Button, Container, Stack, Text} from '@chakra-ui/react'
import {AlertIcon, BrandLogo} from '../../components/icons'
import Field from '../../components/field'
import PasswordRequirements from '../../components/forms/password-requirements'
import {useUpdatePasswordFields} from '../../components/forms/useUpdatePasswordFields'
import {usePasswordReset} from '../../hooks/use-password-reset'
import {useNavigation} from '../../hooks/use-navigation'
import {
    API_ERROR_MESSAGE,
    INVALID_TOKEN_ERROR,
    INVALID_TOKEN_ERROR_MESSAGE
} from '../../../config/constants'

const ResetPasswordLanding = () => {
    const form = useForm()
    const intl = useIntl()
    const {formatMessage} = intl
    const {search} = useLocation()
    const navigate = useNavigation()
    const queryParams = new URLSearchParams(search)
    const email = decodeURIComponent(queryParams.get('email'))
    const token = decodeURIComponent(queryParams.get('token'))
    const fields = useUpdatePasswordFields({form})
    const password = form.watch('password')
    const {resetPassword} = usePasswordReset()

    const messages = useMemo(
        () => ({
            title: formatMessage({
                id: 'reset_password_form.title.reset_password',
                defaultMessage: 'Reset Password'
            }),
            resetPasswordButton: formatMessage({
                id: 'reset_password_form.button.reset_password',
                defaultMessage: 'Reset Password'
            }),
            invalidTokenError: formatMessage(INVALID_TOKEN_ERROR_MESSAGE),
            apiError: formatMessage(API_ERROR_MESSAGE)
        }),
        [intl]
    )

    const submit = async (values) => {
        form.clearErrors()
        try {
            await resetPassword({email, token, newPassword: values.password})
            navigate('/login')
        } catch (error) {
            const errorData = await error.response?.json()
            const message = INVALID_TOKEN_ERROR.test(errorData.message)
                ? messages.invalidTokenError
                : messages.apiError
            form.setError('global', {type: 'manual', message})
        }
    }

    return (
        <Stack justify="center" align="center" gap={6}>
            <BrandLogo width="60px" height="auto" />
            <Stack gap={2}>
                <Text align="center" fontSize="xl" fontWeight="semibold">
                    {messages.title}
                </Text>
            </Stack>
            <Container variant="form">
                <form onSubmit={form.handleSubmit(submit)}>
                    <Stack gap={6} paddingLeft={4} paddingRight={4}>
                        {form.formState.errors?.global && (
                            <Alert data-testid="password-update-error" status="error">
                                <AlertIcon color="red.500" boxSize={4} />
                                <Text fontSize="sm" ml={3}>
                                    {form.formState.errors.global.message}
                                </Text>
                            </Alert>
                        )}
                        <Stack gap={3} pb={2}>
                            <Field {...fields.password} />
                            <PasswordRequirements value={password} />
                        </Stack>
                        <Button type="submit" isLoading={form.formState.isSubmitting}>
                            {messages.resetPasswordButton}
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
