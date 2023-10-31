/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {useIntl, defineMessage} from 'react-intl'
import {Box, Container} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    AuthHelpers,
    useAuthHelper,
    useCustomerBaskets,
    useCustomerId,
    useCustomerType,
    useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import {useForm} from 'react-hook-form'
import {useLocation} from 'react-router-dom'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import LoginForm from '@salesforce/retail-react-app/app/components/login'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'
import {usePrevious} from '@salesforce/retail-react-app/app/hooks/use-previous'
import {isServer} from '@salesforce/retail-react-app/app/utils/utils'
const LOGIN_ERROR_MESSAGE = defineMessage({
    defaultMessage: 'Incorrect username or password, please try again.',
    id: 'login_page.error.incorrect_username_or_password'
})
const Login = () => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const form = useForm()
    const location = useLocation()
    const einstein = useEinstein()
    const {isRegistered, customerType} = useCustomerType()
    const login = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)

    const customerId = useCustomerId()
    const prevAuthType = usePrevious(customerType)
    const {data: baskets} = useCustomerBaskets(
        {parameters: {customerId}},
        {enabled: !!customerId && !isServer, keepPreviousData: true}
    )
    const mergeBasket = useShopperBasketsMutation('mergeBasket')

    const submitForm = async (data) => {
        try {
            await login.mutateAsync({username: data.email, password: data.password})
            const hasBasketItem = baskets?.baskets?.[0]?.productItems?.length > 0
            // we only want to merge basket when the user is logged in as a recurring user
            // only recurring users trigger the login mutation, new user triggers register mutation
            // this logic needs to stay in this block because this is the only place that tells if a user is a recurring user
            // if you change logic here, also change it in login page
            const shouldMergeBasket = hasBasketItem && prevAuthType === 'guest'
            if (shouldMergeBasket) {
                mergeBasket.mutate({
                    headers: {
                        // This is not required since the request has no body
                        // but CommerceAPI throws a '419 - Unsupported Media Type' error if this header is removed.
                        'Content-Type': 'application/json'
                    },
                    parameters: {
                        createDestinationBasket: true
                    }
                })
            }
        } catch (error) {
            const message = /Unauthorized/i.test(error.message)
                ? formatMessage(LOGIN_ERROR_MESSAGE)
                : formatMessage(API_ERROR_MESSAGE)
            form.setError('global', {type: 'manual', message})
        }
    }

    // If customer is registered push to account page
    useEffect(() => {
        if (isRegistered) {
            if (location?.state?.directedFrom) {
                navigate(location.state.directedFrom)
            } else {
                navigate('/account')
            }
        }
    }, [isRegistered])

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
