/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
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
import {useRouteMatch} from 'react-router'
import {useLocation} from 'react-router-dom'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import LoginForm from '@salesforce/retail-react-app/app/components/login'
import PasswordlessEmailConfirmation from '@salesforce/retail-react-app/app/components/email-confirmation/index'
import {
    API_ERROR_MESSAGE,
    CREATE_ACCOUNT_FIRST_ERROR_MESSAGE,
    INVALID_TOKEN_ERROR,
    INVALID_TOKEN_ERROR_MESSAGE,
    FEATURE_UNAVAILABLE_ERROR_MESSAGE,
    LOGIN_TYPES,
    PASSWORDLESS_LOGIN_LANDING_PATH,
    PASSWORDLESS_ERROR_MESSAGES,
    USER_NOT_FOUND_ERROR
} from '@salesforce/retail-react-app/app/constants'
import {usePrevious} from '@salesforce/retail-react-app/app/hooks/use-previous'
import {isServer} from '@salesforce/retail-react-app/app/utils/utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const LOGIN_ERROR_MESSAGE = defineMessage({
    defaultMessage: 'Incorrect username or password, please try again.',
    id: 'login_page.error.incorrect_username_or_password'
})

const LOGIN_VIEW = 'login'
const EMAIL_VIEW = 'email'

const Login = ({initialView = LOGIN_VIEW}) => {
    const {formatMessage} = useIntl()
    const navigate = useNavigation()
    const form = useForm()
    const location = useLocation()
    const queryParams = new URLSearchParams(location.search)
    const {path} = useRouteMatch()
    const einstein = useEinstein()
    const {isRegistered, customerType} = useCustomerType()
    const login = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)
    const loginPasswordless = useAuthHelper(AuthHelpers.LoginPasswordlessUser)
    const authorizePasswordlessLogin = useAuthHelper(AuthHelpers.AuthorizePasswordless)
    const {passwordless = {}, social = {}} = getConfig().app.login || {}
    const isPasswordlessEnabled = !!passwordless?.enabled
    const isSocialEnabled = !!social?.enabled
    const idps = social?.idps

    const customerId = useCustomerId()
    const prevAuthType = usePrevious(customerType)
    const {data: baskets, isSuccess: isSuccessCustomerBaskets} = useCustomerBaskets(
        {parameters: {customerId}},
        {enabled: !!customerId && !isServer, keepPreviousData: true}
    )
    const mergeBasket = useShopperBasketsMutation('mergeBasket')
    const [currentView, setCurrentView] = useState(initialView)
    const [passwordlessLoginEmail, setPasswordlessLoginEmail] = useState('')
    const [loginType, setLoginType] = useState(LOGIN_TYPES.PASSWORD)
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
                    message: formatMessage(API_ERROR_MESSAGE)
                })
            }
        }
    }

    const submitForm = async (data) => {
        form.clearErrors()

        const handlePasswordlessLogin = async (email) => {
            try {
                await authorizePasswordlessLogin.mutateAsync({userid: email})
                setCurrentView(EMAIL_VIEW)
            } catch (error) {
                const message = USER_NOT_FOUND_ERROR.test(error.message)
                    ? formatMessage(CREATE_ACCOUNT_FIRST_ERROR_MESSAGE)
                    : PASSWORDLESS_ERROR_MESSAGES.some((msg) => msg.test(error.message))
                    ? formatMessage(FEATURE_UNAVAILABLE_ERROR_MESSAGE)
                    : formatMessage(API_ERROR_MESSAGE)
                form.setError('global', {type: 'manual', message})
            }
        }

        return {
            login: async (data) => {
                if (loginType === LOGIN_TYPES.PASSWORD) {
                    try {
                        await login.mutateAsync({username: data.email, password: data.password})
                    } catch (error) {
                        const message = /Unauthorized/i.test(error.message)
                            ? formatMessage(LOGIN_ERROR_MESSAGE)
                            : formatMessage(API_ERROR_MESSAGE)
                        form.setError('global', {type: 'manual', message})
                    }
                    handleMergeBasket()
                } else if (loginType === LOGIN_TYPES.PASSWORDLESS) {
                    setPasswordlessLoginEmail(data.email)
                    await handlePasswordlessLogin(data.email)
                }
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
        if (path === PASSWORDLESS_LOGIN_LANDING_PATH && isSuccessCustomerBaskets) {
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
                        ? formatMessage(INVALID_TOKEN_ERROR_MESSAGE)
                        : formatMessage(API_ERROR_MESSAGE)
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
                {!form.formState.isSubmitSuccessful && currentView === LOGIN_VIEW && (
                    <LoginForm
                        form={form}
                        submitForm={submitForm}
                        clickCreateAccount={() => navigate('/registration')}
                        handlePasswordlessLoginClick={() => {
                            setLoginType(LOGIN_TYPES.PASSWORDLESS)
                        }}
                        handleForgotPasswordClick={() => navigate('/reset-password')}
                        isPasswordlessEnabled={isPasswordlessEnabled}
                        isSocialEnabled={isSocialEnabled}
                        idps={idps}
                        setLoginType={setLoginType}
                    />
                )}
                {form.formState.isSubmitSuccessful && currentView === EMAIL_VIEW && (
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
