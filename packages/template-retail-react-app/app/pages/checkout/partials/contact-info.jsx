/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {
    Alert,
    AlertDialog,
    AlertDialogBody,
    AlertDialogContent,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogOverlay,
    AlertIcon,
    Box,
    Button,
    Container,
    Stack,
    Text
} from '@chakra-ui/react'
import {useForm} from 'react-hook-form'
import {FormattedMessage, useIntl} from 'react-intl'
import {useCheckout} from '../util/checkout-context'
import useLoginFields from '../../../components/forms/useLoginFields'
import {ToggleCard, ToggleCardEdit, ToggleCardSummary} from '../../../components/toggle-card'
import Field from '../../../components/field'
import {AuthModal, useAuthModal} from '../../../hooks/use-auth-modal'
import useNavigation from '../../../hooks/use-navigation'

const ContactInfo = () => {
    const {formatMessage} = useIntl()
    const authModal = useAuthModal('password')
    const navigate = useNavigation()

    const {
        customer,
        basket,
        isGuestCheckout,
        setIsGuestCheckout,
        step,
        login,
        checkoutSteps,
        setCheckoutStep,
        goToNextStep
    } = useCheckout()

    const form = useForm({
        defaultValues: {email: customer?.email || basket.customerInfo?.email || '', password: ''}
    })

    const fields = useLoginFields({form})

    const [error, setError] = useState(null)
    const [showPasswordField, setShowPasswordField] = useState(false)
    const [signOutConfirmDialogIsOpen, setSignOutConfirmDialogIsOpen] = useState(false)

    const submitForm = async (data) => {
        setError(null)
        try {
            await login(data)
            goToNextStep()
        } catch (error) {
            if (/invalid credentials/i.test(error.message)) {
                setError(
                    formatMessage({
                        defaultMessage: 'Incorrect username or password, please try again.',
                        id: 'contact_info.error.incorrect_username_or_password'
                    })
                )
            } else {
                setError(error.message)
            }
        }
    }

    const toggleGuestCheckout = () => {
        if (error) {
            setError(null)
        }
        setShowPasswordField(!showPasswordField)
        setIsGuestCheckout(!isGuestCheckout)
    }

    const onForgotPasswordClick = () => {
        authModal.onOpen()
    }

    return (
        <ToggleCard
            id="step-0"
            title={formatMessage({
                defaultMessage: 'Contact Info',
                id: 'contact_info.title.contact_info'
            })}
            editing={step === checkoutSteps.Contact_Info}
            isLoading={form.formState.isSubmitting}
            onEdit={() => {
                if (!isGuestCheckout) {
                    setSignOutConfirmDialogIsOpen(true)
                } else {
                    setCheckoutStep(checkoutSteps.Contact_Info)
                }
            }}
            editLabel={
                !isGuestCheckout ? (
                    <FormattedMessage defaultMessage="Sign Out" id="contact_info.action.sign_out" />
                ) : undefined
            }
        >
            <ToggleCardEdit>
                <Container variant="form">
                    <form onSubmit={form.handleSubmit(submitForm)}>
                        <Stack spacing={6}>
                            {error && (
                                <Alert status="error">
                                    <AlertIcon />
                                    {error}
                                </Alert>
                            )}

                            <Stack spacing={5} position="relative">
                                <Field {...fields.email} />
                                {showPasswordField && (
                                    <Stack>
                                        <Field {...fields.password} />
                                        <Box>
                                            <Button
                                                variant="link"
                                                size="sm"
                                                onClick={onForgotPasswordClick}
                                            >
                                                <FormattedMessage
                                                    defaultMessage="Forgot password?"
                                                    id="contact_info.link.forgot_password"
                                                />
                                            </Button>
                                        </Box>
                                    </Stack>
                                )}
                            </Stack>

                            <Stack spacing={3}>
                                <Button type="submit">
                                    {!showPasswordField ? (
                                        <FormattedMessage
                                            defaultMessage="Checkout as Guest"
                                            id="contact_info.button.checkout_as_guest"
                                        />
                                    ) : (
                                        <FormattedMessage
                                            defaultMessage="Log In"
                                            id="contact_info.button.login"
                                        />
                                    )}
                                </Button>
                                <Button variant="outline" onClick={toggleGuestCheckout}>
                                    {!showPasswordField ? (
                                        <FormattedMessage
                                            defaultMessage="Already have an account? Log in"
                                            id="contact_info.button.already_have_account"
                                        />
                                    ) : (
                                        <FormattedMessage
                                            defaultMessage="Checkout as Guest"
                                            id="contact_info.button.checkout_as_guest"
                                        />
                                    )}
                                </Button>
                            </Stack>
                        </Stack>
                    </form>
                </Container>
                <AuthModal {...authModal} />
            </ToggleCardEdit>
            <ToggleCardSummary>
                <Text>{basket?.customerInfo?.email || customer?.email}</Text>

                <SignOutConfirmationDialog
                    isOpen={signOutConfirmDialogIsOpen}
                    onClose={() => setSignOutConfirmDialogIsOpen(false)}
                    onConfirm={async () => {
                        await customer.logout()
                        navigate('/login')
                        setSignOutConfirmDialogIsOpen(false)
                    }}
                />
            </ToggleCardSummary>
        </ToggleCard>
    )
}

const SignOutConfirmationDialog = ({isOpen, onConfirm, onClose}) => {
    const cancelRef = useRef()

    return (
        <AlertDialog isOpen={isOpen} leastDestructiveRef={cancelRef} onClose={onClose}>
            <AlertDialogOverlay>
                <AlertDialogContent>
                    <AlertDialogHeader fontSize="lg" fontWeight="bold">
                        <FormattedMessage
                            defaultMessage="Sign Out"
                            id="signout_confirmation_dialog.heading.sign_out"
                        />
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        <FormattedMessage
                            defaultMessage="Are you sure you want to sign out? You will need to sign back in to proceed
                        with your current order."
                            id="signout_confirmation_dialog.message.sure_to_sign_out"
                        />
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button ref={cancelRef} variant="outline" onClick={onClose}>
                            <FormattedMessage
                                defaultMessage="Cancel"
                                id="signout_confirmation_dialog.button.cancel"
                            />
                        </Button>
                        <Button colorScheme="red" onClick={onConfirm} ml={3}>
                            <FormattedMessage
                                defaultMessage="Sign Out"
                                id="signout_confirmation_dialog.button.sign_out"
                            />
                        </Button>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialogOverlay>
        </AlertDialog>
    )
}

SignOutConfirmationDialog.propTypes = {
    isOpen: PropTypes.bool,
    onClose: PropTypes.func,
    onConfirm: PropTypes.func
}

export default ContactInfo
