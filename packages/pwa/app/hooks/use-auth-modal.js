import React, {Fragment, useEffect, useRef, useState} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {useForm} from 'react-hook-form'
import {
    Button,
    Box,
    Modal,
    ModalBody,
    ModalCloseButton,
    ModalContent,
    ModalHeader,
    ModalOverlay,
    Stack,
    Text,
    useDisclosure,
    Alert,
    Link as ChakraLink
} from '@chakra-ui/react'
import useCustomer from '../commerce-api/hooks/useCustomer'
import {AlertIcon, BrandLogo} from '../components/icons'
import Link from '../components/link'
import LoginFields from '../components/forms/login-fields'
import RegistrationFields from '../components/forms/registration-fields'
import ResetPasswordFields from '../components/forms/reset-password-fields'

const LOGIN_VIEW = 'login'
const REGISTER_VIEW = 'register'
const PASSWORD_VIEW = 'password'

export const AuthModal = ({initialView = LOGIN_VIEW, ...props}) => {
    const {formatMessage} = useIntl()
    const customer = useCustomer()
    const [currentView, setCurrentView] = useState(initialView)
    const form = useForm()
    const submittedEmail = useRef()

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
                : error.message
            form.setError('global', {type: 'manual', message})
        }
    }

    const handleRegister = async (data) => {
        try {
            await customer.registerCustomer(data)
        } catch (error) {
            form.setError('global', {type: 'manual', message: error.message})
        }
    }

    const handleResetPassword = async ({email}) => {
        try {
            await customer.getResetPasswordToken(email)
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

    return (
        <Modal size="sm" closeOnOverlayClick={false} data-testid="sf-auth-modal" {...props}>
            <ModalOverlay />

            <ModalContent>
                <ModalHeader pt={12} pb={0}>
                    <Stack justify="center" align="center" spacing={6}>
                        <BrandLogo width="60px" height="auto" />

                        {!form.formState.isSubmitSuccessful && (
                            <Text align="center">
                                {currentView === LOGIN_VIEW && (
                                    <FormattedMessage defaultMessage="Welcome Back" />
                                )}
                                {currentView === REGISTER_VIEW && (
                                    <FormattedMessage defaultMessage="Let's get started" />
                                )}
                                {currentView === PASSWORD_VIEW && (
                                    <FormattedMessage defaultMessage="Reset Password" />
                                )}
                            </Text>
                        )}

                        {form.formState.isSubmitSuccessful && (
                            <Stack>
                                {[LOGIN_VIEW, REGISTER_VIEW].includes(currentView) && (
                                    <Fragment>
                                        <Text align="center">
                                            <FormattedMessage defaultMessage="Hi, " />{' '}
                                            {customer.firstName || (
                                                <FormattedMessage defaultMessage="Welcome" />
                                            )}
                                        </Text>
                                        <Text align="center" fontSize="md">
                                            <FormattedMessage defaultMessage="Where would you like to go next?" />
                                        </Text>
                                    </Fragment>
                                )}
                                {currentView === PASSWORD_VIEW && (
                                    <FormattedMessage defaultMessage="Password Reset" />
                                )}
                            </Stack>
                        )}
                    </Stack>
                </ModalHeader>

                <ModalCloseButton />

                <ModalBody pb={8}>
                    {!form.formState.isSubmitSuccessful && (
                        <Stack spacing={6}>
                            <Text fontSize="sm" align="center" color="gray.700">
                                {currentView === REGISTER_VIEW && (
                                    <FormattedMessage defaultMessage="Create an account and get first access to the very best products, inspiration and community." />
                                )}
                                {currentView === PASSWORD_VIEW && (
                                    <FormattedMessage defaultMessage="Enter your email to recieve instructions on how to reset your password" />
                                )}
                            </Text>

                            <form
                                onSubmit={form.handleSubmit(submitForm)}
                                data-testid="sf-auth-modal-form"
                            >
                                <Stack spacing={8}>
                                    {form.errors?.global && (
                                        <Alert status="error">
                                            <AlertIcon color="red.500" boxSize={4} />
                                            <Text fontSize="sm" ml={3}>
                                                {form.errors.global.message}
                                            </Text>
                                        </Alert>
                                    )}

                                    {currentView === LOGIN_VIEW && (
                                        <>
                                            <Stack>
                                                <LoginFields form={form} />

                                                <Box>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        onClick={() =>
                                                            setCurrentView(PASSWORD_VIEW)
                                                        }
                                                    >
                                                        <FormattedMessage defaultMessage="Forgot password?" />
                                                    </Button>
                                                </Box>
                                            </Stack>

                                            <Stack spacing={6}>
                                                <Button
                                                    type="submit"
                                                    onClick={() => form.clearErrors('global')}
                                                    isLoading={form.formState.isSubmitting}
                                                >
                                                    <FormattedMessage defaultMessage="Sign in" />
                                                </Button>

                                                <Stack direction="row" spacing={1} justify="center">
                                                    <Text fontSize="sm">
                                                        <FormattedMessage defaultMessage="Don't have an account?" />
                                                    </Text>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        onClick={() =>
                                                            setCurrentView(REGISTER_VIEW)
                                                        }
                                                    >
                                                        <FormattedMessage defaultMessage="Create account" />
                                                    </Button>
                                                </Stack>
                                            </Stack>
                                        </>
                                    )}

                                    {currentView === REGISTER_VIEW && (
                                        <>
                                            <RegistrationFields form={form} />

                                            <Stack spacing={6}>
                                                <Button
                                                    type="submit"
                                                    onClick={() => form.clearErrors('global')}
                                                    isLoading={form.formState.isSubmitting}
                                                >
                                                    <FormattedMessage defaultMessage="Create account" />
                                                </Button>

                                                <Stack direction="row" spacing={1} justify="center">
                                                    <Text fontSize="sm">
                                                        <FormattedMessage defaultMessage="Already have an account?" />
                                                    </Text>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        onClick={() => setCurrentView(LOGIN_VIEW)}
                                                    >
                                                        <FormattedMessage defaultMessage="Sign in" />
                                                    </Button>
                                                </Stack>

                                                <Text fontSize="sm" align="center">
                                                    <FormattedMessage
                                                        defaultMessage="By creating an account, you agree to Salesforce’s <policy>Privacy Policy</policy> and <terms>Terms & Conditions</terms>"
                                                        values={{
                                                            // eslint-disable-next-line react/display-name
                                                            policy: (chunks) => (
                                                                <ChakraLink
                                                                    as={Link}
                                                                    to="/privacy-policy"
                                                                    color="blue.600"
                                                                >
                                                                    {chunks}
                                                                </ChakraLink>
                                                            ),
                                                            // eslint-disable-next-line react/display-name
                                                            terms: (chunks) => (
                                                                <ChakraLink
                                                                    as={Link}
                                                                    to="/terms-conditions"
                                                                    color="blue.600"
                                                                >
                                                                    {chunks}
                                                                </ChakraLink>
                                                            )
                                                        }}
                                                    />
                                                </Text>
                                            </Stack>
                                        </>
                                    )}

                                    {currentView === PASSWORD_VIEW && (
                                        <>
                                            <ResetPasswordFields form={form} />

                                            <Stack spacing={6}>
                                                <Button
                                                    type="submit"
                                                    onClick={() => form.clearErrors('global')}
                                                    isLoading={form.formState.isSubmitting}
                                                >
                                                    <FormattedMessage defaultMessage="Reset password" />
                                                </Button>

                                                <Stack direction="row" spacing={1} justify="center">
                                                    <Text fontSize="sm">
                                                        <FormattedMessage
                                                            defaultMessage="Or return to"
                                                            description="Precedes link to return to sign in"
                                                        />
                                                    </Text>
                                                    <Button
                                                        variant="link"
                                                        size="sm"
                                                        onClick={() => setCurrentView(LOGIN_VIEW)}
                                                    >
                                                        <FormattedMessage defaultMessage="Sign in" />
                                                    </Button>
                                                </Stack>
                                            </Stack>
                                        </>
                                    )}
                                </Stack>
                            </form>
                        </Stack>
                    )}

                    {form.formState.isSubmitSuccessful && (
                        <Box>
                            {[LOGIN_VIEW, REGISTER_VIEW].includes(currentView) && (
                                <Stack spacing={4} pt={4}>
                                    <Button
                                        as={Link}
                                        to="/account"
                                        variant="outline"
                                        onClick={props.onClose}
                                    >
                                        <FormattedMessage defaultMessage="View account" />
                                    </Button>
                                    <Button onClick={props.onClose}>
                                        <FormattedMessage defaultMessage="Continue shopping" />
                                    </Button>
                                </Stack>
                            )}

                            {currentView === PASSWORD_VIEW && (
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
                            )}
                        </Box>
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
    onClose: PropTypes.func.isRequired
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
