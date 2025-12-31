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
    useCustomerType
} from '@salesforce/commerce-sdk-react'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import Seo from '@salesforce/retail-react-app/app/components/seo'
import {useForm} from 'react-hook-form'
import {useRouteMatch} from 'react-router'
import {useLocation} from 'react-router-dom'
import useEinstein from '@salesforce/retail-react-app/app/hooks/use-einstein'
import useDataCloud from '@salesforce/retail-react-app/app/hooks/use-datacloud'
import LoginForm from '@salesforce/retail-react-app/app/components/login'
import OtpAuth from '@salesforce/retail-react-app/app/components/otp-auth'
import {
    API_ERROR_MESSAGE,
    INVALID_TOKEN_ERROR,
    INVALID_TOKEN_ERROR_MESSAGE,
    FEATURE_UNAVAILABLE_ERROR_MESSAGE,
    PASSWORDLESS_LOGIN_LANDING_PATH,
    PASSWORDLESS_ERROR_MESSAGES
} from '@salesforce/retail-react-app/app/constants'
import {isServer, noop} from '@salesforce/retail-react-app/app/utils/utils'
import {useMergeBasket} from '@salesforce/retail-react-app/app/hooks/use-merge-basket'
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
    const dataCloud = useDataCloud()
    const {isRegistered} = useCustomerType()
    const login = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)
    const loginPasswordless = useAuthHelper(AuthHelpers.LoginPasswordlessUser)
    const authorizePasswordlessLogin = useAuthHelper(AuthHelpers.AuthorizePasswordless)
    const {passwordless = {}, social = {}} = getConfig().app.login || {}
    const isPasswordlessEnabled = !!passwordless?.enabled
    const passwordlessMode = passwordless?.mode
    const isSocialEnabled = !!social?.enabled
    const idps = social?.idps

    const customerId = useCustomerId()
    const {isSuccess: isSuccessCustomerBaskets} = useCustomerBaskets(
        {parameters: {customerId}},
        {enabled: !!customerId && !isServer, keepPreviousData: true}
    )
    const handleMergeBasket = useMergeBasket()
    const [redirectPath, setRedirectPath] = useState('')
    const [isOtpAuthOpen, setIsOtpAuthOpen] = useState(false)

    const handlePasswordlessLogin = async (email) => {
        try {
            await authorizePasswordlessLogin.mutateAsync({
                userid: email,
                mode: passwordlessMode
            })
            setIsOtpAuthOpen(true)
        } catch (error) {
            const message = PASSWORDLESS_ERROR_MESSAGES.some((msg) => msg.test(error.message))
                ? formatMessage(FEATURE_UNAVAILABLE_ERROR_MESSAGE)
                : formatMessage(API_ERROR_MESSAGE)
            form.setError('global', {type: 'manual', message})
        }
    }

    const handleOtpVerification = async (pwdlessLoginToken) => {
        try {
            await loginPasswordless.mutateAsync({pwdlessLoginToken})
        } catch (e) {
            const errorData = await e.response?.json()
            const message = INVALID_TOKEN_ERROR.test(errorData.message)
                ? formatMessage(INVALID_TOKEN_ERROR_MESSAGE)
                : formatMessage(API_ERROR_MESSAGE)
            form.setError('global', {type: 'manual', message})
        }
    }

    const submitForm = async (data) => {
        form.clearErrors()

        // If passwordless is enabled and the password is not provided, handle passwordless login
        if (isPasswordlessEnabled && !data.password) {
            const email = data.email
            await handlePasswordlessLogin(email)
            return
        }

        try {
            await login.mutateAsync({username: data.email, password: data.password})
        } catch (error) {
            const message = /Unauthorized/i.test(error.message)
                ? formatMessage(LOGIN_ERROR_MESSAGE)
                : formatMessage(API_ERROR_MESSAGE)
            form.setError('global', {type: 'manual', message})
        }
    }

    // Handles passwordless login by retrieving the 'token' from the query parameters and
    // executing a passwordless login attempt using the token. The process waits for the
    // customer baskets to be loaded to guarantee proper basket merging.
    useEffect(() => {
        if (path.endsWith(PASSWORDLESS_LOGIN_LANDING_PATH) && isSuccessCustomerBaskets) {
            const token = decodeURIComponent(queryParams.get('token'))
            if (queryParams.get('redirect_url')) {
                setRedirectPath(decodeURIComponent(queryParams.get('redirect_url')))
            } else {
                setRedirectPath('')
            }

            handleOtpVerification(token)
        }
    }, [path, isSuccessCustomerBaskets])

    // If customer is registered push to account page and merge the basket
    useEffect(() => {
        if (isRegistered) {
            setIsOtpAuthOpen(false)
            handleMergeBasket().catch(() => {
                form.setError('global', {
                    type: 'manual',
                    message: formatMessage(API_ERROR_MESSAGE)
                })
            })
            const redirectTo = redirectPath ? redirectPath : '/account'
            navigate(redirectTo)
        }
    }, [isRegistered, redirectPath])

    /**************** Einstein ****************/
    useEffect(() => {
        einstein.sendViewPage(location.pathname)
        dataCloud.sendViewPage(location.pathname)
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
                    // We let submitForm handle passwordless login to ensure when the form submission
                    // is triggered in other ways like pressing Enter it is handled correctly
                    handlePasswordlessLoginClick={noop}
                    handleForgotPasswordClick={() => navigate('/reset-password')}
                    isPasswordlessEnabled={isPasswordlessEnabled}
                    isSocialEnabled={isSocialEnabled}
                    idps={idps}
                />
                <OtpAuth
                    isOpen={isOtpAuthOpen}
                    onClose={() => setIsOtpAuthOpen(false)}
                    form={form}
                    handleSendEmailOtp={handlePasswordlessLogin}
                    handleOtpVerification={handleOtpVerification}
                    hideCheckoutAsGuestButton={true}
                />
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
