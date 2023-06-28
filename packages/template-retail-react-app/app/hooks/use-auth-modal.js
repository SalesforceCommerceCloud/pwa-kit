/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {defineMessage, FormattedMessage, useIntl} from 'react-intl'
import {useForm} from 'react-hook-form'
import {
    Button,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalOverlay,
    Stack,
    Text,
    useDisclosure,
    useToast
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    AuthHelpers,
    useAuthHelper,
    useCustomer,
    useCustomerId,
    useCustomerType,
    useCustomerBaskets,
    useShopperCustomersMutation,
    useShopperBasketsMutation,
    ShopperCustomersMutations
} from '@salesforce/commerce-sdk-react'
import {BrandLogo} from '@salesforce/retail-react-app/app/components/icons'
import LoginForm from '@salesforce/retail-react-app/app/components/login'
import ResetPasswordForm from '@salesforce/retail-react-app/app/components/reset-password'
import RegisterForm from '@salesforce/retail-react-app/app/components/register'
import {noop} from '@salesforce/retail-react-app/app/utils/utils'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {usePrevious} from '@salesforce/retail-react-app/app/hooks/use-previous'
import {isServer} from '@salesforce/retail-react-app/app/utils/utils'
const LOGIN_VIEW = 'login'
const REGISTER_VIEW = 'register'
const PASSWORD_VIEW = 'password'

const LOGIN_ERROR = defineMessage({
    defaultMessage: "Something's not right with your email or password. Try again.",
    id: 'auth_modal.error.incorrect_email_or_password'
})

export const AuthModal = ({
    initialView = LOGIN_VIEW,
    onLoginSuccess = noop,
    onRegistrationSuccess = noop,
    isOpen,
    onOpen,
    onClose,
    ...props
}) => {
    const {formatMessage} = useIntl()
    const customerId = useCustomerId()
    const {isRegistered, customerType} = useCustomerType()
    const prevAuthType = usePrevious(customerType)

    const customer = useCustomer(
        {parameters: {customerId}},
        {enabled: !!customerId && isRegistered}
    )

    const navigate = useNavigation()
    const [currentView, setCurrentView] = useState(initialView)
    const form = useForm()
    const submittedEmail = useRef()
    const toast = useToast()
    const login = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)
    const register = useAuthHelper(AuthHelpers.Register)

    const getResetPasswordToken = useShopperCustomersMutation(
        ShopperCustomersMutations.GetResetPasswordToken
    )

    const {data: baskets} = useCustomerBaskets(
        {parameters: {customerId}},
        {enabled: !!customerId && !isServer, keepPreviousData: true}
    )
    const mergeBasket = useShopperBasketsMutation('mergeBasket')

    const submitForm = async (data) => {
        form.clearErrors()

        const onLoginSuccess = () => {
            navigate('/account')
        }

        return {
            login: async (data) => {
                try {
                    await login.mutateAsync({
                        username: data.email,
                        password: data.password
                    })
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
                        ? formatMessage(LOGIN_ERROR)
                        : formatMessage(API_ERROR_MESSAGE)
                    form.setError('global', {type: 'manual', message})
                }
            },
            register: async (data) => {
                try {
                    const body = {
                        customer: {
                            firstName: data.firstName,
                            lastName: data.lastName,
                            email: data.email,
                            login: data.email
                        },
                        password: data.password
                    }

                    await register.mutateAsync(body)
                    onLoginSuccess()
                } catch (error) {
                    form.setError('global', {
                        type: 'manual',
                        message: formatMessage(API_ERROR_MESSAGE)
                    })
                }
            },
            password: async (data) => {
                try {
                    const body = {
                        login: data.email
                    }
                    await getResetPasswordToken.mutateAsync({body})
                } catch (e) {
                    form.setError('global', {
                        type: 'manual',
                        message: formatMessage(API_ERROR_MESSAGE)
                    })
                }
            }
        }[currentView](data)
    }

    // Reset form and local state when opening the modal
    useEffect(() => {
        if (isOpen) {
            setCurrentView(initialView)
            submittedEmail.current = undefined
            form.reset()
        }
    }, [isOpen])

    // Auto-focus the first field in each form view
    useEffect(() => {
        const initialField = {
            [LOGIN_VIEW]: 'email',
            [REGISTER_VIEW]: 'firstName',
            [PASSWORD_VIEW]: 'email'
        }[currentView]
        const fieldsRef = form.control?.fieldsRef?.current
        fieldsRef?.[initialField]?.ref.focus()
    }, [form.control?.fieldsRef?.current])

    // Clear form state when changing views
    useEffect(() => {
        form.reset()
    }, [currentView])

    useEffect(() => {
        // Lets determine if the user has either logged in, or registed.
        const loggingIn = currentView === LOGIN_VIEW
        const registering = currentView === REGISTER_VIEW
        const isNowRegistered = isOpen && isRegistered && (loggingIn || registering)
        // If the customer changed, but it's not because they logged in or registered. Do nothing.
        if (!isNowRegistered) {
            return
        }

        // We are done with the modal.
        onClose()

        // Show a toast only for those registed users returning to the site.
        if (loggingIn) {
            toast({
                variant: 'subtle',
                title: `${formatMessage(
                    {
                        defaultMessage: 'Welcome {name},',
                        id: 'auth_modal.info.welcome_user'
                    },
                    {
                        name: customer.data?.firstName || ''
                    }
                )}`,
                description: `${formatMessage({
                    defaultMessage: "You're now signed in.",
                    id: 'auth_modal.description.now_signed_in'
                })}`,
                status: 'success',
                position: 'top-right',
                isClosable: true
            })

            // Execute action to be performed on successful login
            onLoginSuccess()
        }

        if (registering) {
            // Execute action to be performed on successful registration
            onRegistrationSuccess()
        }
    }, [isRegistered])

    const onBackToSignInClick = () =>
        initialView === PASSWORD_VIEW ? onClose() : setCurrentView(LOGIN_VIEW)

    const PasswordResetSuccess = () => (
        <Stack justify="center" align="center" spacing={6}>
            <BrandLogo width="60px" height="auto" />
            <Text align="center" fontSize="md">
                <FormattedMessage
                    defaultMessage={'Password Reset'}
                    id="auth_modal.password_reset_success.title.password_reset"
                />
            </Text>
            <Stack spacing={6} pt={4}>
                <Text align="center" fontSize="sm">
                    <FormattedMessage
                        defaultMessage="You will receive an email at <b>{email}</b> with a link to reset your password shortly."
                        id="auth_modal.password_reset_success.info.will_email_shortly"
                        values={{
                            email: submittedEmail.current,

                            b: (chunks) => <b>{chunks}</b>
                        }}
                    />
                </Text>

                <Button onClick={onBackToSignInClick}>
                    <FormattedMessage
                        defaultMessage="Back to Sign In"
                        id="auth_modal.password_reset_success.button.back_to_sign_in"
                    />
                </Button>
            </Stack>
        </Stack>
    )
    return (
        <Modal
            size="sm"
            closeOnOverlayClick={false}
            data-testid="sf-auth-modal"
            isOpen={isOpen}
            onOpen={onOpen}
            onClose={onClose}
            {...props}
        >
            <ModalOverlay />
            <ModalContent>
                <ModalCloseButton />
                <ModalBody pb={8} bg="white" paddingBottom={14} marginTop={14}>
                    {!form.formState.isSubmitSuccessful && currentView === LOGIN_VIEW && (
                        <LoginForm
                            form={form}
                            submitForm={submitForm}
                            clickCreateAccount={() => setCurrentView(REGISTER_VIEW)}
                            clickForgotPassword={() => setCurrentView(PASSWORD_VIEW)}
                        />
                    )}
                    {!form.formState.isSubmitSuccessful && currentView === REGISTER_VIEW && (
                        <RegisterForm
                            form={form}
                            submitForm={submitForm}
                            clickSignIn={onBackToSignInClick}
                        />
                    )}
                    {!form.formState.isSubmitSuccessful && currentView === PASSWORD_VIEW && (
                        <ResetPasswordForm
                            form={form}
                            submitForm={submitForm}
                            clickSignIn={onBackToSignInClick}
                        />
                    )}
                    {form.formState.isSubmitSuccessful && currentView === PASSWORD_VIEW && (
                        <PasswordResetSuccess />
                    )}
                </ModalBody>
            </ModalContent>
        </Modal>
    )
}

AuthModal.propTypes = {
    initialView: PropTypes.oneOf([LOGIN_VIEW, REGISTER_VIEW, PASSWORD_VIEW]),
    isOpen: PropTypes.bool.isRequired,
    onOpen: PropTypes.func.isRequired,
    onClose: PropTypes.func.isRequired,
    onLoginSuccess: PropTypes.func,
    onRegistrationSuccess: PropTypes.func
}

/**
 *
 * @param {('register'|'login'|'password')} initialView - the initial view for the modal
 * @returns {Object} - Object props to be spread on to the AuthModal component
 */
export const useAuthModal = (initialView = LOGIN_VIEW) => {
    const {isOpen, onOpen, onClose} = useDisclosure()

    return {
        initialView,
        isOpen,
        onOpen,
        onClose
    }
}
