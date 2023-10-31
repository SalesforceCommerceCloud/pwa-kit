/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useEffect} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {
    Box,
    Button,
    Container,
    Stack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useForm} from 'react-hook-form'
import {
    useShopperCustomersMutation,
    ShopperCustomersMutations
} from '@salesforce/commerce-sdk-react'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import ResetPasswordForm from '@salesforce/retail-react-app/app/components/reset-password'
import {BrandLogo} from '@salesforce/retail-react-app/app/components/icons'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import {useLocation} from 'react-router-dom'

const ResetPassword = () => {
    const form = useForm()
    const navigate = useNavigation()
    const [submittedEmail, setSubmittedEmail] = useState('')
    const [showSubmittedSuccess, setShowSubmittedSuccess] = useState(false)
    const einstein = useEinstein()
    const {pathname} = useLocation()
    const getResetPasswordToken = useShopperCustomersMutation(
        ShopperCustomersMutations.GetResetPasswordToken
    )

    const submitForm = async ({email}) => {
        const body = {
            login: email
        }
        try {
            await getResetPasswordToken.mutateAsync({body})
            setSubmittedEmail(email)
            setShowSubmittedSuccess(!showSubmittedSuccess)
        } catch (error) {
            form.setError('global', {type: 'manual', message: error.message})
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
                {!showSubmittedSuccess ? (
                    <ResetPasswordForm
                        form={form}
                        submitForm={submitForm}
                        clickSignIn={() => navigate('/login')}
                    />
                ) : (
                    <Stack justify="center" align="center" spacing={6}>
                        <BrandLogo width="60px" height="auto" />
                        <Text align="center" fontSize="md">
                            <FormattedMessage
                                defaultMessage={'Password Reset'}
                                id="reset_password.title.password_reset"
                            />
                        </Text>
                        <Stack spacing={6} pt={4}>
                            <Text align="center" fontSize="sm">
                                <FormattedMessage
                                    defaultMessage="You will receive an email at <b>{email}</b> with a link to reset your password shortly."
                                    id="reset_password.info.receive_email_shortly"
                                    values={{
                                        email: submittedEmail,

                                        b: (chunks) => <b>{chunks}</b>
                                    }}
                                />
                            </Text>
                            <Button onClick={() => navigate('/login')}>
                                <FormattedMessage
                                    defaultMessage="Back to Sign In"
                                    id="reset_password.button.back_to_sign_in"
                                />
                            </Button>
                        </Stack>
                    </Stack>
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
