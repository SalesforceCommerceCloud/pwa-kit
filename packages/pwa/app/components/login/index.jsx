/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {Fragment} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Alert, Box, Button, Stack, Text} from '@chakra-ui/react'
import {AlertIcon, BrandLogo} from '../icons'
import LoginFields from '../../components/forms/login-fields'
import {noop} from '../../utils/utils'

const LoginForm = ({submitForm, clickForgotPassword = noop, clickCreateAccount = noop, form}) => {
    return (
        <Fragment>
            <Stack justify="center" align="center" spacing={8} marginBottom={8}>
                <BrandLogo width="60px" height="auto" />
                <Text align="center" fontSize="xl" fontWeight="semibold">
                    <FormattedMessage defaultMessage="Welcome Back" />
                </Text>
            </Stack>
            <form onSubmit={form.handleSubmit(submitForm)} data-testid="sf-auth-modal-form">
                <Stack spacing={8} paddingLeft={4} paddingRight={4}>
                    {form.errors?.global && (
                        <Alert status="error">
                            <AlertIcon color="red.500" boxSize={4} />
                            <Text fontSize="sm" ml={3}>
                                {form.errors.global.message}
                            </Text>
                        </Alert>
                    )}
                    <Stack>
                        <LoginFields form={form} />

                        <Box>
                            <Button variant="link" size="sm" onClick={clickForgotPassword}>
                                <FormattedMessage defaultMessage="Forgot password?" />
                            </Button>
                        </Box>
                    </Stack>
                    <Stack spacing={6}>
                        <Button
                            type="submit"
                            onClick={() => form.clearErrors('global')}
                            isLoading={form.formState.isSubmitting}
                        >
                            <FormattedMessage defaultMessage="Sign in" />
                        </Button>

                        <Stack direction="row" spacing={1} justify="center">
                            <Text fontSize="sm">
                                <FormattedMessage defaultMessage="Don't have an account?" />
                            </Text>
                            <Button variant="link" size="sm" onClick={clickCreateAccount}>
                                <FormattedMessage defaultMessage="Create account" />
                            </Button>
                        </Stack>
                    </Stack>
                </Stack>
            </form>
        </Fragment>
    )
}

LoginForm.propTypes = {
    submitForm: PropTypes.func,
    clickForgotPassword: PropTypes.func,
    clickCreateAccount: PropTypes.func,
    form: PropTypes.object
}

export default LoginForm
