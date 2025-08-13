/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef, useState, useMemo} from 'react'
import PropTypes from 'prop-types'
import {Alert, Box, Button, Container, Dialog, Stack, Text} from '@chakra-ui/react'
import {useForm} from 'react-hook-form'
import {useIntl} from 'react-intl'
import {useCheckout} from '../util/checkout-context'
import {useLoginFields} from '../../../components/forms/useLoginFields'
import {ToggleCard, ToggleCardEdit, ToggleCardSummary} from '../../../components/toggle-card'
import Field from '../../../components/field'
import SafePortal from '../../../components/safe-portal'
import {AlertIcon} from '../../../components/icons'
import LoginState from '../../../pages/checkout/partials/login-state'
import {AuthModal, EMAIL_VIEW, PASSWORD_VIEW, useAuthModal} from '../../../hooks/use-auth-modal'
import {useNavigation} from '../../../hooks/use-navigation'
import {useCurrentCustomer, useCurrentBasket} from '../../../hooks'
import {isAbsoluteURL} from '../../../page-designer/utils'
import {useAppOrigin} from '../../../hooks/use-app-origin'
import {AuthHelpers, useAuthHelper, useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

import {
    API_ERROR_MESSAGE,
    FEATURE_UNAVAILABLE_ERROR_MESSAGE,
    CREATE_ACCOUNT_FIRST_ERROR_MESSAGE,
    PASSWORDLESS_ERROR_MESSAGES,
    USER_NOT_FOUND_ERROR
} from '../../../../config/constants'

const ContactInfo = ({isPasswordlessEnabled = false, idps = []}) => {
    const intl = useIntl()
    const {formatMessage} = intl
    const navigate = useNavigation()
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()
    const appOrigin = useAppOrigin()
    const config = getConfig()
    const login = useAuthHelper(AuthHelpers.LoginRegisteredUserB2C)
    const logout = useAuthHelper(AuthHelpers.Logout)
    const authorizePasswordlessLogin = useAuthHelper(AuthHelpers.AuthorizePasswordless)
    const updateCustomerForBasket = useShopperBasketsMutation('updateCustomerForBasket')
    const mergeBasket = useShopperBasketsMutation('mergeBasket')

    const {step, STEPS, goToStep, goToNextStep} = useCheckout()

    const form = useForm({
        defaultValues: {email: customer?.email || basket?.customerInfo?.email || '', password: ''}
    })

    const fields = useLoginFields({form})
    const emailRef = useRef()

    const [error, setError] = useState(null)
    const [showPasswordField, setShowPasswordField] = useState(false)
    const [signOutConfirmDialogIsOpen, setSignOutConfirmDialogIsOpen] = useState(false)

    const [authModalView, setAuthModalView] = useState(PASSWORD_VIEW)
    const authModal = useAuthModal(authModalView)
    const passwordlessConfigCallback = config.login?.passwordless?.callbackURI
    const callbackURL = isAbsoluteURL(passwordlessConfigCallback)
        ? passwordlessConfigCallback
        : `${appOrigin}${passwordlessConfigCallback}`

    const handlePasswordlessLogin = async (email) => {
        try {
            const redirectPath = window.location.pathname + (window.location.search || '')
            await authorizePasswordlessLogin.mutateAsync({
                userid: email,
                callbackURI: `${callbackURL}?redirectUrl=${redirectPath}`
            })
            setAuthModalView(EMAIL_VIEW)
            authModal.onOpen()
        } catch (error) {
            const message = USER_NOT_FOUND_ERROR.test(error.message)
                ? formatMessage(CREATE_ACCOUNT_FIRST_ERROR_MESSAGE)
                : PASSWORDLESS_ERROR_MESSAGES.some((msg) => msg.test(error.message))
                ? formatMessage(FEATURE_UNAVAILABLE_ERROR_MESSAGE)
                : formatMessage(API_ERROR_MESSAGE)
            setError(message)
        }
    }

    const messages = useMemo(
        () => ({
            contactInfoTitle: formatMessage({
                id: 'contact_info.title.contact_info',
                defaultMessage: 'Contact Info'
            }),
            signOut: formatMessage({
                id: 'contact_info.action.sign_out',
                defaultMessage: 'Sign Out'
            }),
            editContactInfo: formatMessage({
                id: 'toggle_card.action.editContactInfo',
                defaultMessage: 'Edit Contact Info'
            }),
            forgotPassword: formatMessage({
                id: 'contact_info.link.forgot_password',
                defaultMessage: 'Forgot password?'
            }),
            checkoutAsGuest: formatMessage({
                id: 'contact_info.button.checkout_as_guest',
                defaultMessage: 'Checkout as Guest'
            }),
            logIn: formatMessage({
                id: 'contact_info.button.login',
                defaultMessage: 'Log In'
            }),
            incorrectCredentials: formatMessage({
                id: 'contact_info.error.incorrect_username_or_password',
                defaultMessage: 'Incorrect username or password, please try again.'
            })
        }),
        [intl]
    )

    const submitForm = async (data) => {
        setError(null)
        try {
            if (!data.password) {
                await updateCustomerForBasket.mutateAsync({
                    parameters: {basketId: basket.basketId},
                    body: {email: data.email}
                })
            } else {
                await login.mutateAsync({username: data.email, password: data.password})

                const hasBasketItem = basket.productItems?.length > 0
                if (hasBasketItem) {
                    mergeBasket.mutate({
                        parameters: {
                            createDestinationBasket: true
                        }
                    })
                }
            }
            goToNextStep()
        } catch (error) {
            if (/Unauthorized/i.test(error.message)) {
                setError(messages.incorrectCredentials)
            } else {
                setError(error.message)
            }
        }
    }

    const togglePasswordField = () => {
        if (error) {
            setError(null)
        }
        setShowPasswordField(!showPasswordField)
        if (emailRef.current) {
            emailRef.current.focus()
        }
    }

    const onForgotPasswordClick = () => {
        setAuthModalView(PASSWORD_VIEW)
        authModal.onOpen()
    }

    useEffect(() => {
        if (!showPasswordField) {
            form.unregister('password')
        }
    }, [showPasswordField])

    const onPasswordlessLoginClick = async (e) => {
        const isValid = await form.trigger('email')
        const domForm = e.target.closest('form')
        if (isValid && domForm.checkValidity()) {
            const email = form.getValues().email
            await handlePasswordlessLogin(email)
        } else {
            domForm.reportValidity()
        }
    }

    return (
        <ToggleCard
            id="step-0"
            title={messages.contactInfoTitle}
            editing={step === STEPS.CONTACT_INFO}
            isLoading={form.formState.isSubmitting}
            onEdit={() => {
                if (customer.isRegistered) {
                    setSignOutConfirmDialogIsOpen(true)
                } else {
                    goToStep(STEPS.CONTACT_INFO)
                }
            }}
            editLabel={customer.isRegistered ? messages.signOut : messages.editContactInfo}
        >
            <ToggleCardEdit>
                <Container variant="form">
                    <form onSubmit={form.handleSubmit(submitForm)}>
                        <Stack gap={6}>
                            {error && (
                                <Alert.Root status="error">
                                    <Alert.Indicator>
                                        <AlertIcon color="red.500" boxSize="4" />
                                    </Alert.Indicator>
                                    <Alert.Title>{error}</Alert.Title>
                                </Alert.Root>
                            )}

                            <Stack gap={5} position="relative">
                                <Field {...fields.email} inputRef={emailRef} />
                                {showPasswordField && (
                                    <Stack>
                                        <Field {...fields.password} />
                                        <Box>
                                            <Button
                                                variant="link-blue"
                                                size="sm"
                                                onClick={onForgotPasswordClick}
                                            >
                                                {messages.forgotPassword}
                                            </Button>
                                        </Box>
                                    </Stack>
                                )}
                            </Stack>

                            <Stack gap={3}>
                                <Button type="submit">
                                    {!showPasswordField ? messages.checkoutAsGuest : messages.logIn}
                                </Button>
                                <LoginState
                                    form={form}
                                    isPasswordlessEnabled={isPasswordlessEnabled}
                                    showPasswordField={showPasswordField}
                                    togglePasswordField={togglePasswordField}
                                    handlePasswordlessLoginClick={onPasswordlessLoginClick}
                                    //@sfdc-extension-line SFDC_EXT_SOCIAL_LOGIN
                                    idps={idps}
                                />
                            </Stack>
                        </Stack>
                    </form>
                </Container>
                <AuthModal {...authModal} initialEmail={form.getValues().email} />
            </ToggleCardEdit>
            <ToggleCardSummary>
                <Text>{basket?.customerInfo?.email || customer?.email}</Text>

                <SignOutConfirmationDialog
                    isOpen={signOutConfirmDialogIsOpen}
                    onClose={() => setSignOutConfirmDialogIsOpen(false)}
                    onConfirm={async () => {
                        await logout.mutateAsync()
                        navigate('/login')
                        setSignOutConfirmDialogIsOpen(false)
                    }}
                />
            </ToggleCardSummary>
        </ToggleCard>
    )
}

ContactInfo.propTypes = {
    isPasswordlessEnabled: PropTypes.bool,
    //@sfdc-extension-line SFDC_EXT_SOCIAL_LOGIN
    idps: PropTypes.arrayOf(PropTypes.string)
}

const SignOutConfirmationDialog = ({isOpen, onConfirm, onClose}) => {
    const {formatMessage} = useIntl()
    const cancelRef = useRef()

    const messages = {
        signOutTitle: formatMessage({
            id: 'signout_confirmation_dialog.heading.sign_out',
            defaultMessage: 'Sign Out'
        }),
        confirmMessage: formatMessage({
            id: 'signout_confirmation_dialog.message.sure_to_sign_out',
            defaultMessage:
                'Are you sure you want to sign out? You will need to sign back in to proceed with your current order.'
        }),
        cancel: formatMessage({
            id: 'signout_confirmation_dialog.button.cancel',
            defaultMessage: 'Cancel'
        }),
        signOut: formatMessage({
            id: 'signout_confirmation_dialog.button.sign_out',
            defaultMessage: 'Sign Out'
        })
    }

    return (
        <Dialog.Root
            role="alertdialog"
            initialFocusEl={cancelRef}
            open={isOpen}
            onOpenChange={(details) => !details.open && onClose()}
        >
            <SafePortal>
                <Dialog.Backdrop />
                <Dialog.Positioner>
                    <Dialog.Content>
                        <Dialog.Header>
                            <Dialog.Title fontSize="lg" fontWeight="bold">
                                {messages.signOutTitle}
                            </Dialog.Title>
                        </Dialog.Header>

                        <Dialog.Body>{messages.confirmMessage}</Dialog.Body>

                        <Dialog.Footer>
                            <Dialog.ActionTrigger asChild>
                                <Button ref={cancelRef} variant="outline">
                                    {messages.cancel}
                                </Button>
                            </Dialog.ActionTrigger>
                            <Button colorPalette="red" onClick={onConfirm} ml={3}>
                                {messages.signOut}
                            </Button>
                        </Dialog.Footer>
                    </Dialog.Content>
                </Dialog.Positioner>
            </SafePortal>
        </Dialog.Root>
    )
}

SignOutConfirmationDialog.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    onConfirm: PropTypes.func
}

export default ContactInfo
