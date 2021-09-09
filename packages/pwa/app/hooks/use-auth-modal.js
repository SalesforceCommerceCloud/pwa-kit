/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
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
} from '@chakra-ui/react'
import useCustomer from '../commerce-api/hooks/useCustomer'
import {BrandLogo} from '../components/icons'
import LoginForm from '../components/login'
import ResetPasswordForm from '../components/reset-password'
import RegisterForm from '../components/register'
import {useHistory} from 'react-router-dom'
import {noop} from '../utils/utils'
import {API_ERROR_MESSAGE} from '../constants'

const LOGIN_VIEW = 'login'
const REGISTER_VIEW = 'register'
const PASSWORD_VIEW = 'password'

export const AuthModal = ({
    initialView = LOGIN_VIEW,
    onLoginSuccess = noop,
    onRegistrationSuccess = noop,
    onPasswordResetSuccess = noop,
    ...props
}) => {
    const {formatMessage, locale} = useIntl()
    const customer = useCustomer()
    const [currentView, setCurrentView] = useState(initialView)
    const form = useForm()
    const submittedEmail = useRef()
    const history = useHistory()
    const toast = useToast()

    const submitForm = async (data) => {
        form.clearErrors()

        return {
            login: handleLogin,
            register: handleRegister,
            password: handleResetPassword
        }[currentView](data)
    }

    const handleLogin = async (data) => {
        try {
            await customer.login(data)
        } catch (error) {
            const message = /invalid credentials/i.test(error.message)
                ? formatMessage({
                      defaultMessage:
                          "Something's not right with your email or password. Try again."
                  })
                : formatMessage(
                      {defaultMessage: '{errorMessage}'},
                      {errorMessage: API_ERROR_MESSAGE}
                  )
            form.setError('global', {type: 'manual', message})
        }
    }

    const handleRegister = async (data) => {
        try {
            await customer.registerCustomer(data)
            history.push(`/${locale}/account`)
        } catch (error) {
            form.setError('global', {type: 'manual', message: error.message})
        }
    }

    const handleResetPassword = async ({email}) => {
        try {
            await customer.getResetPasswordToken(email)
            // Execute action to be perfromed on successful passoword reset
            await onPasswordResetSuccess()
            submittedEmail.current = email
        } catch (error) {
            form.setError('global', {type: 'manual', message: error.message})
        }
    }

    // Reset form and local state when opening the modal
    useEffect(() => {
        if (props.isOpen) {
            setCurrentView(initialView)
            submittedEmail.current = undefined
            form.reset()
        }
    }, [props.isOpen])

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
        const {isOpen} = props
        const isNowRegistered = isOpen && customer.isRegistered && (loggingIn || registering)

        // If the customer changed, but it's not because they logged in or registered. Do nothing.
        if (!isNowRegistered) {
            return
        }

        // We are done with the modal.
        props.onClose()

        // Show a toast only for those registed users returning to the site.
        if (loggingIn) {
            toast({
                variant: 'subtle',
                title: `${formatMessage(
                    {
                        defaultMessage: 'Welcome {name},'
                    },
                    {
                        name: customer?.firstName
                    }
                )}`,
                description: `${formatMessage({
                    defaultMessage: "You're now signed in"
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
    }, [customer])

    const PasswordResetSuccess = () => (
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
                            email: submittedEmail.current,
                            // eslint-disable-next-line react/display-name
                            b: (chunks) => <b>{chunks}</b>
                        }}
                    />
                </Text>

                <Button onClick={() => setCurrentView(LOGIN_VIEW)}>
                    <FormattedMessage defaultMessage="Back to sign in" />
                </Button>
            </Stack>
        </Stack>
    )

    return (
        <Modal size="sm" closeOnOverlayClick={false} data-testid="sf-auth-modal" {...props}>
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
                            clickSignIn={() => setCurrentView(LOGIN_VIEW)}
                        />
                    )}
                    {!form.formState.isSubmitSuccessful && currentView === PASSWORD_VIEW && (
                        <ResetPasswordForm
                            form={form}
                            submitForm={submitForm}
                            clickSignIn={() => setCurrentView(LOGIN_VIEW)}
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
    onRegistrationSuccess: PropTypes.func,
    onPasswordResetSuccess: PropTypes.func
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
