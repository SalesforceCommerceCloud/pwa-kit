/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
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
import {useHistory} from 'react-router-dom'
import {useForm} from 'react-hook-form'
import {FormattedMessage, useIntl} from 'react-intl'
import {useCheckout} from '../util/checkout-context'
import useLoginFields from '../../../components/forms/useLoginFields'
import {ToggleCard, ToggleCardEdit, ToggleCardSummary} from '../../../components/toggle-card'
import Field from '../../../components/field'

const ContactInfo = () => {
    const {formatMessage} = useIntl()
    const history = useHistory()

    const {
        customer,
        basket,
        isGuestCheckout,
        setIsGuestCheckout,
        step,
        login,
        setCheckoutStep,
        goToNextStep
    } = useCheckout()

    const form = useForm({
        defaultValues: {email: customer?.email || basket.customerInfo?.email || '', password: ''}
    })

    const fields = useLoginFields({form})

    const [error, setError] = useState(null)
    const [showPasswordField, setShowPasswordField] = useState(true)
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
                        defaultMessage: 'Incorrect username or password, please try again.'
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
    return (
        // TODO: [l10n] localize this title
        <ToggleCard
            id="step-0"
            title="Contact Info"
            editing={step === 0}
            isLoading={form.formState.isSubmitting}
            onEdit={() => {
                if (!isGuestCheckout) {
                    setSignOutConfirmDialogIsOpen(true)
                } else {
                    setCheckoutStep(0)
                }
            }}
            editLabel={
                !isGuestCheckout ? <FormattedMessage defaultMessage="Sign Out" /> : undefined
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
                                            <Button variant="link" size="sm">
                                                <FormattedMessage defaultMessage="Forgot password?" />
                                            </Button>
                                        </Box>
                                    </Stack>
                                )}
                            </Stack>

                            <Stack spacing={3}>
                                <Button type="submit">
                                    {!showPasswordField ? (
                                        <FormattedMessage defaultMessage="Checkout as guest" />
                                    ) : (
                                        <FormattedMessage defaultMessage="Log in" />
                                    )}
                                </Button>
                                <Button variant="outline" onClick={toggleGuestCheckout}>
                                    {!showPasswordField ? (
                                        <FormattedMessage defaultMessage="Already have an account? Log in" />
                                    ) : (
                                        <FormattedMessage defaultMessage="Checkout as guest" />
                                    )}
                                </Button>
                            </Stack>
                        </Stack>
                    </form>
                </Container>
            </ToggleCardEdit>
            <ToggleCardSummary>
                <Text>{basket?.customerInfo?.email || customer?.email}</Text>

                <SignOutConfirmationDialog
                    isOpen={signOutConfirmDialogIsOpen}
                    onClose={() => setSignOutConfirmDialogIsOpen(false)}
                    onConfirm={async () => {
                        await customer.logout()
                        await basket.getOrCreateBasket()
                        history.replace('/')
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
                        <FormattedMessage defaultMessage="Sign Out" />
                    </AlertDialogHeader>

                    <AlertDialogBody>
                        <FormattedMessage
                            defaultMessage="Are you sure you want to sign out? You will need to sign back in to proceed
                        with your current order."
                        />
                    </AlertDialogBody>

                    <AlertDialogFooter>
                        <Button ref={cancelRef} variant="outline" onClick={onClose}>
                            <FormattedMessage defaultMessage="Cancel" />
                        </Button>
                        <Button colorScheme="red" onClick={onConfirm} ml={3}>
                            <FormattedMessage defaultMessage="Sign Out" />
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
