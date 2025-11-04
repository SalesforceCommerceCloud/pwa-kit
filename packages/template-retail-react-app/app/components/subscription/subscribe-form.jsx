/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Text,
    Heading,
    Input,
    InputGroup,
    InputRightElement,
    Button,
    Alert,
    AlertIcon,
    AlertDescription,
    Link,
    Spinner,
    useMultiStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useIntl, FormattedMessage} from 'react-intl'
import SocialIcons from '@salesforce/retail-react-app/app/components/social-icons'

const SubscribeForm = ({subscription, ...otherProps}) => {
    // Use SubscribeForm's own theme config instead of Footer's context
    const subscribeFormStyles = useMultiStyleConfig('SubscribeForm')

    // Map SubscribeForm theme parts to Footer's expected structure
    const styles = {
        subscribe: subscribeFormStyles.container,
        subscribeHeading: subscribeFormStyles.heading,
        subscribeMessage: subscribeFormStyles.message,
        subscribeField: subscribeFormStyles.field,
        subscribeButtonContainer: subscribeFormStyles.buttonContainer,
        socialIcons: subscribeFormStyles.socialIcons
    }
    const intl = useIntl()
    const {state, actions} = subscription

    const messages = {
        heading: intl.formatMessage({
            id: 'footer.subscribe.heading.first_to_know',
            defaultMessage: 'Be the first to know'
        }),
        description: intl.formatMessage({
            id: 'footer.subscribe.description.sign_up',
            defaultMessage: 'Sign up to stay in the loop about the hottest deals'
        }),
        emailAriaLabel: intl.formatMessage({
            id: 'footer.subscribe.email.assistive_msg',
            defaultMessage: 'Email address for newsletter'
        }),
        buttonSignUp: intl.formatMessage({
            id: 'footer.subscribe.button.sign_up',
            defaultMessage: 'Sign Up'
        }),
        emailPlaceholder: intl.formatMessage({
            id: 'footer.subscribe.email.placeholder_text',
            defaultMessage: 'you@email.com'
        })
    }

    const termsConditions = intl.formatMessage({
        id: 'footer.link.terms_conditions',
        defaultMessage: 'Terms & Conditions'
    })
    const privacyPolicy = intl.formatMessage({
        id: 'footer.link.privacy_policy',
        defaultMessage: 'Privacy Policy'
    })

    // Check if we're still loading subscription data
    const isFetchingSubscriptions = state?.isFetching

    return (
        <Box {...styles.subscribe} {...otherProps} position="relative">
            <Heading as="h2" {...styles.subscribeHeading}>
                {messages.heading}
            </Heading>
            <Text {...styles.subscribeMessage}>{messages.description}</Text>

            {state?.feedback?.message && (
                <Alert
                    status={state.feedback.type === 'error' ? 'error' : 'success'}
                    mb={4}
                    borderRadius="base"
                >
                    <AlertIcon />
                    <AlertDescription>{state.feedback.message}</AlertDescription>
                </Alert>
            )}

            {/* Show spinner overlay while fetching subscriptions */}
            {isFetchingSubscriptions && (
                <Box
                    position="absolute"
                    top="0"
                    left="0"
                    right="0"
                    bottom="0"
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    bg="whiteAlpha.800"
                    zIndex="1"
                    borderRadius="base"
                >
                    <Spinner
                        thickness="4px"
                        speed="0.65s"
                        emptyColor="gray.200"
                        color="blue.600"
                        size="lg"
                    />
                </Box>
            )}

            <Box>
                <InputGroup>
                    {/* Had to swap the following InputRightElement and Input
                        to avoid the hydration error due to mismatched html between server and client side.
                        This is a workaround for Lastpass plugin that automatically injects its icon for input fields.
                    */}
                    <InputRightElement {...styles.subscribeButtonContainer}>
                        <Button
                            variant="footer"
                            onClick={actions?.submit}
                            isLoading={state?.isLoading}
                            loadingText={messages.buttonSignUp}
                        >
                            {messages.buttonSignUp}
                        </Button>
                    </InputRightElement>
                    <Input
                        type="email"
                        placeholder={messages.emailPlaceholder}
                        aria-label={messages.emailAriaLabel}
                        value={state?.email || ''}
                        onChange={(e) => actions?.setEmail?.(e.target.value)}
                        onKeyDown={(e) => {
                            if (
                                e.key === 'Enter' &&
                                !state?.isLoading &&
                                !isFetchingSubscriptions
                            ) {
                                actions?.submit?.()
                            }
                        }}
                        disabled={state?.isLoading || isFetchingSubscriptions}
                        id="subscribe-email"
                        {...styles.subscribeField}
                    />
                </InputGroup>

                <Text fontSize="xs" color="gray.600" mt={2}>
                    <FormattedMessage
                        id="footer.subscribe.disclaimer"
                        defaultMessage="By subscribing, you agree to our {terms} and {privacy}."
                        values={{
                            terms: (
                                <Link href="/" color="blue.600">
                                    {termsConditions}
                                </Link>
                            ),
                            privacy: (
                                <Link href="/" color="blue.600">
                                    {privacyPolicy}
                                </Link>
                            )
                        }}
                    />
                </Text>
            </Box>

            <SocialIcons variant="flex-start" pinterestInnerColor="black" {...styles.socialIcons} />
        </Box>
    )
}

SubscribeForm.propTypes = {
    subscription: PropTypes.shape({
        state: PropTypes.shape({
            email: PropTypes.string,
            isLoading: PropTypes.bool,
            isFetching: PropTypes.bool,
            feedback: PropTypes.shape({
                message: PropTypes.string,
                type: PropTypes.oneOf(['success', 'error'])
            }),
            matchingSubscriptionsCount: PropTypes.number
        }),
        actions: PropTypes.shape({
            setEmail: PropTypes.func,
            submit: PropTypes.func
        })
    }).isRequired
}

export default SubscribeForm
