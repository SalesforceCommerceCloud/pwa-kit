/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState, useMemo} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {keepPreviousData} from '@tanstack/react-query'
import {Box, Container} from '@chakra-ui/react'
import {
    AuthHelpers,
    useAuthHelper,
    useCustomerBaskets,
    useCustomerId,
    useCustomerType,
    useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react'
import {useNavigation} from '../../hooks/use-navigation'
import Seo from '../../components/seo'
import {useForm} from 'react-hook-form'
import {useRouteMatch} from 'react-router-dom'
import {useLocation} from 'react-router-dom'
import LoginForm from '../../components/login'
import PasswordlessEmailConfirmation from '../../components/email-confirmation/index'
import {
    API_ERROR_MESSAGE,
    CREATE_ACCOUNT_FIRST_ERROR_MESSAGE,
    INVALID_TOKEN_ERROR,
    INVALID_TOKEN_ERROR_MESSAGE,
    FEATURE_UNAVAILABLE_ERROR_MESSAGE,
    PASSWORDLESS_ERROR_MESSAGES,
    USER_NOT_FOUND_ERROR
} from '../../../config/constants'
import {usePrevious} from '../../hooks/use-previous'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {isServer} from '../../utils/utils'

const LOGIN_VIEW = 'login'
const EMAIL_VIEW = 'email'

const Login = ({initialView = LOGIN_VIEW}) => {
    const intl = useIntl()
    const {formatMessage} = intl

    const messages = useMemo(
        () => ({
            loginError: formatMessage({
                id: 'login_page.error.incorrect_username_or_password',
                defaultMessage: 'Incorrect username or password, please try again.'
            }),
            apiError: formatMessage(API_ERROR_MESSAGE),
            createAccountFirst: formatMessage(CREATE_ACCOUNT_FIRST_ERROR_MESSAGE),
            featureUnavailable: formatMessage(FEATURE_UNAVAILABLE_ERROR_MESSAGE),
            invalidToken: formatMessage(INVALID_TOKEN_ERROR_MESSAGE)
        }),
        [intl]
    )
    const navigate = useNavigation()
    const form = useForm()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const {path} = useRouteMatch()
    const {login: loginConfig} = getConfig()
    const {isRegistered, customerType} = useCustomerType()
    const login = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)
    const loginPasswordless = useAuthHelper(AuthHelpers.LoginPasswordlessUser)
    const authorizePasswordlessLogin = useAuthHelper(AuthHelpers.AuthorizePasswordless)
    const {passwordless = {}, social = {}} = loginConfig
    const isPasswordlessEnabled = !!passwordless?.enabled
    //@sfdc-extension-line SFDC_EXT_SOCIAL_LOGIN
    const idps = social?.idps

    const customerId = useCustomerId()
    const prevAuthType = usePrevious(customerType)
    const {data: baskets, isSuccess: isSuccessCustomerBaskets} = useCustomerBaskets(
        {parameters: {customerId}},
        {
            enabled: !!customerId && !isServer,
            placeholderData: keepPreviousData
        }
    )
    const mergeBasket = useShopperBasketsMutation('mergeBasket')
    const [currentView, setCurrentView] = useState(initialView)
    const [passwordlessLoginEmail, setPasswordlessLoginEmail] = useState('')
    const [redirectPath, setRedirectPath] = useState('')

    const handleMergeBasket = () => {
        const hasBasketItem = baskets?.baskets?.[0]?.productItems?.length > 0
        // we only want to merge basket when the user is logged in as a recurring user
        // only recurring users trigger the login mutation, new user triggers register mutation
        // this logic needs to stay in this block because this is the only place that tells if a user is a recurring user
        // if you change logic here, also change it in login page
        const shouldMergeBasket = hasBasketItem && prevAuthType === 'guest'
        if (shouldMergeBasket) {
            try {
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
            } catch (e) {
                form.setError('global', {
                    type: 'manual',
                    message: messages.apiError
                })
            }
        }
    }

    const handlePasswordlessLogin = async (email) => {
        try {
            await authorizePasswordlessLogin.mutateAsync({userid: email})
            setPasswordlessLoginEmail(email)
            setCurrentView(EMAIL_VIEW)
        } catch (error) {
            const message = USER_NOT_FOUND_ERROR.test(error.message)
                ? messages.createAccountFirst
                : PASSWORDLESS_ERROR_MESSAGES.some((msg) => msg.test(error.message))
                ? messages.featureUnavailable
                : messages.apiError
            form.setError('global', {type: 'manual', message})
        }
    }

    const submitForm = async (data, isPasswordless = false) => {
        form.clearErrors()

        return {
            login: async (data) => {
                if (isPasswordless) {
                    const email = data.email
                    await handlePasswordlessLogin(email)
                    return
                }

                try {
                    await login.mutateAsync({username: data.email, password: data.password})
                } catch (error) {
                    const message = /Unauthorized/i.test(error.message)
                        ? messages.loginError
                        : messages.apiError
                    form.setError('global', {type: 'manual', message})
                }
                handleMergeBasket()
            },
            email: async () => {
                await handlePasswordlessLogin(passwordlessLoginEmail)
            }
        }[currentView](data)
    }

    // Handles passwordless login by retrieving the 'token' from the query parameters and
    // executing a passwordless login attempt using the token. The process waits for the
    // customer baskets to be loaded to guarantee proper basket merging.
    useEffect(() => {
        if (path === loginConfig.passwordless.landingPath && isSuccessCustomerBaskets) {
            const token = decodeURIComponent(queryParams.get('token'))
            if (queryParams.get('redirect_url')) {
                setRedirectPath(decodeURIComponent(queryParams.get('redirect_url')))
            } else {
                setRedirectPath('')
            }

            const passwordlessLogin = async () => {
                try {
                    await loginPasswordless.mutateAsync({pwdlessLoginToken: token})
                } catch (e) {
                    const errorData = await e.response?.json()
                    const message = INVALID_TOKEN_ERROR.test(errorData.message)
                        ? messages.invalidToken
                        : messages.apiError
                    form.setError('global', {type: 'manual', message})
                }
            }
            passwordlessLogin()
        }
    }, [path, isSuccessCustomerBaskets])

    // If customer is registered push to account page and merge the basket
    useEffect(() => {
        if (isRegistered) {
            handleMergeBasket()
            const redirectTo = redirectPath ? redirectPath : '/account'
            navigate(redirectTo)
        }
    }, [isRegistered, redirectPath])

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
                {!form.formState.isSubmitSuccessful && currentView === LOGIN_VIEW && (
                    <LoginForm
                        form={form}
                        submitForm={(data) => {
                            const shouldUsePasswordless = isPasswordlessEnabled && !data.password
                            return submitForm(data, shouldUsePasswordless)
                        }}
                        clickCreateAccount={() => navigate('/registration')}
                        handleForgotPasswordClick={() => navigate('/reset-password')}
                        isPasswordlessEnabled={isPasswordlessEnabled}
                        //@sfdc-extension-line SFDC_EXT_SOCIAL_LOGIN
                        idps={idps}
                    />
                )}
                {currentView === EMAIL_VIEW && (
                    <PasswordlessEmailConfirmation
                        form={form}
                        submitForm={submitForm}
                        email={passwordlessLoginEmail}
                    />
                )}
            </Container>
        </Box>
    )
}

Login.getTemplateName = () => 'login'

Login.propTypes = {
    initialView: PropTypes.oneOf([LOGIN_VIEW, EMAIL_VIEW]),
    match: PropTypes.object
}

export default Login
