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
import {
    ShopperLoginHelpers,
    useShopperLoginHelper,
    useCustomerType
} from 'commerce-sdk-react-preview'
import useNavigation from '../../hooks/use-navigation'
import Seo from '../../components/seo'
import {useForm} from 'react-hook-form'
import {useLocation} from 'react-router-dom'
import useEinstein from '../../commerce-api/hooks/useEinstein'
import LoginForm from '../../components/login'
import {API_ERROR_MESSAGE} from '../../constants'

const Login = () => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const form = useForm()
    const location = useLocation()
    const einstein = useEinstein()
    const customerType = useCustomerType()
    const login = useShopperLoginHelper(ShopperLoginHelpers.LoginRegisteredUserB2C)

    const submitForm = async (data) => {
        return login.mutateAsync(
            {username: data.email, password: data.password},
            {
                onSuccess: () => {
                    if (location?.state?.directedFrom) {
                        navigate(location.state.directedFrom)
                    } else {
                        navigate('/account')
                    }
                },
                onError: (error) => {
                    const message = /Unauthorized/i.test(error.message)
                        ? formatMessage({
                              defaultMessage:
                                  "Something's not right with your email or password. Try again.",
                              id: 'auth_modal.error.incorrect_email_or_password'
                          })
                        : formatMessage(API_ERROR_MESSAGE)
                    form.setError('global', {type: 'manual', message})
                }
            }
        )
    }

    // If customer is registered push to account page
    useEffect(() => {
        if (customerType === 'registered') {
            navigate('/account')
        }
    }, [])

    /**************** Einstein ****************/
    useEffect(() => {
        einstein.sendViewPage(location.pathname)
    }, [])

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
