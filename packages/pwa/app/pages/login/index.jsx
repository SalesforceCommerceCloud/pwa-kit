/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Box, Container} from '@chakra-ui/react'
import useCustomer from '../../commerce-api/hooks/useCustomer'
import useNavigation from '../../hooks/use-navigation'
import Seo from '../../components/seo'
import {useForm} from 'react-hook-form'
import {useLocation} from 'react-router-dom'

import LoginForm from '../../components/login'

const Login = () => {
    const {formatMessage} = useIntl()

    const navigate = useNavigation()
    const customer = useCustomer()
    const form = useForm()
    const location = useLocation()

    const submitForm = async (data) => {
        try {
            await customer.login(data)
        } catch (error) {
            const message = /invalid credentials/i.test(error.message)
                ? formatMessage({
                      defaultMessage: 'Incorrect username or password, please try again.',
                      id: 'login_page.error.incorrect_username_or_password'
                  })
                : error.message
            form.setError('global', {type: 'manual', message})
        }
    }

    // If customer is registered push to account page
    useEffect(() => {
        if (customer.authType != null && customer.isRegistered) {
            if (location?.state?.directedFrom) {
                navigate(location.state.directedFrom)
            } else {
                navigate('/account')
            }
        }
    }, [customer])

    return (
        <Box data-testid="login-page" bg="gray.50" py={[8, 16]}>
            <Seo title="Sign in" description="Customer sign in" />
            <Container
                paddingTop={16}
                width={['100%', '407px']}
                bg="white"
                paddingBottom={14}
                marginTop={8}
                marginBottom={8}
                borderRadius="base"
            >
                <LoginForm
                    form={form}
                    submitForm={submitForm}
                    clickCreateAccount={() => navigate('/registration')}
                    clickForgotPassword={() => navigate('/reset-password')}
                />
            </Container>
        </Box>
    )
}

Login.getTemplateName = () => 'login'

Login.propTypes = {
    match: PropTypes.object
}

export default Login
