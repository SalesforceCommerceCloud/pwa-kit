/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useMemo} from 'react'
import {useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {Box, Container} from '@chakra-ui/react'
import {useForm} from 'react-hook-form'
import Seo from '../../components/seo'
import ResetPasswordForm from '../../components/reset-password'
import ResetPasswordLanding from '../../pages/reset-password/reset-password-landing'
import {useNavigation} from '../../hooks/use-navigation'
import {useRouteMatch} from 'react-router-dom'
import {usePasswordReset} from '../../hooks/use-password-reset'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

import {API_ERROR_MESSAGE, FEATURE_UNAVAILABLE_ERROR_MESSAGE} from '../../../config/constants'

const ResetPassword = () => {
    const intl = useIntl()
    const {formatMessage} = intl
    const form = useForm()
    const navigate = useNavigation()
    const {path} = useRouteMatch()
    const {getPasswordResetToken} = usePasswordReset()
    const {login: loginConfig} = getConfig()

    const messages = useMemo(
        () => ({
            featureUnavailableError: formatMessage(FEATURE_UNAVAILABLE_ERROR_MESSAGE),
            apiError: formatMessage(API_ERROR_MESSAGE)
        }),
        [intl]
    )

    const submitForm = async ({email}) => {
        try {
            await getPasswordResetToken(email)
        } catch (e) {
            const message =
                e.response?.status === 400 ? messages.featureUnavailableError : messages.apiError
            form.setError('global', {type: 'manual', message})
        }
    }

    return (
        <Box data-testid="reset-password-page" bg="gray.50" py={[8, 16]}>
            <Seo title="Reset password" description="Reset customer password" />
            <Container
                paddingTop={16}
                width={['100%', '407px']}
                bg="white"
                paddingBottom={14}
                marginTop={8}
                marginBottom={8}
                borderRadius="base"
            >
                {path === loginConfig.resetPassword.landingPath ? (
                    <ResetPasswordLanding />
                ) : (
                    <ResetPasswordForm
                        form={form}
                        submitForm={submitForm}
                        clickSignIn={() => navigate('/login')}
                    />
                )}
            </Container>
        </Box>
    )
}

ResetPassword.getTemplateName = () => 'reset-password'

ResetPassword.propTypes = {
    match: PropTypes.object
}

export default ResetPassword
