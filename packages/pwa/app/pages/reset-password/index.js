/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Box, Button, Container, Stack, Text} from '@chakra-ui/react'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import Seo from '../../components/seo'
import {useForm} from 'react-hook-form'
import ResetPasswordForm from '../../components/reset-password'
import {BrandLogo} from '../../components/icons'
import useNavigation from '../../hooks/use-navigation'

const ResetPassword = () => {
    const customer = useCustomer()
    const form = useForm()
    const navigate = useNavigation()
    const [submittedEmail, setSubmittedEmail] = useState('')
    const [showSubmittedSuccess, setShowSubmittedSuccess] = useState(false)

    const submitForm = async ({email}) => {
        try {
            await customer.getResetPasswordToken(email)
            setSubmittedEmail(email)
            setShowSubmittedSuccess(!showSubmittedSuccess)
        } catch (error) {
            form.setError('global', {type: 'manual', message: error.message})
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
                            <FormattedMessage defaultMessage={'Password Reset'} />
                        </Text>
                        <Stack spacing={6} pt={4}>
                            <Text align="center" fontSize="sm">
                                <FormattedMessage
                                    defaultMessage="You will receive an email at <b>{email}</b> with a link to reset your password shortly."
                                    values={{
                                        email: submittedEmail,
                                        // eslint-disable-next-line react/display-name
                                        b: (chunks) => <b>{chunks}</b>
                                    }}
                                />
                            </Text>
                            <Button onClick={() => navigate('/login')}>
                                <FormattedMessage defaultMessage="Back to sign in" />
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
