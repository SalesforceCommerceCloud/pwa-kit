/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import {useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {Box, Container} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useForm} from 'react-hook-form'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import ResetPasswordForm from '@salesforce/retail-react-app/app/components/reset-password'
import ResetPasswordLanding from '@salesforce/retail-react-app/app/pages/reset-password/reset-password-landing'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import {useLocation} from 'react-router-dom'
import {useRouteMatch} from 'react-router'
import {usePasswordReset} from '@salesforce/retail-react-app/app/hooks/use-password-reset'
import {
    RESET_PASSWORD_LANDING_PATH,
    API_ERROR_MESSAGE,
    FEATURE_UNAVAILABLE_ERROR_MESSAGE
} from '@salesforce/retail-react-app/app/constants'

const ResetPassword = () => {
    const {formatMessage} = useIntl()
    const form = useForm()
    const navigate = useNavigation()
    const einstein = useEinstein()
    const {pathname} = useLocation()
    const {path} = useRouteMatch()
    const {getPasswordResetToken} = usePasswordReset()

    const submitForm = async ({email}) => {
        try {
            await getPasswordResetToken(email)
        } catch (e) {
            const message =
                e.response?.status === 400
                    ? formatMessage(FEATURE_UNAVAILABLE_ERROR_MESSAGE)
                    : formatMessage(API_ERROR_MESSAGE)
            form.setError('global', {type: 'manual', message})
        }
    }

    /**************** Einstein ****************/
    useEffect(() => {
        einstein.sendViewPage(pathname)
    }, [])

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
                {path === RESET_PASSWORD_LANDING_PATH ? (
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
