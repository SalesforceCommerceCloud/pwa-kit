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
        socialIcons: subscribeFormStyles.socialIcons,
        subscribeDisclaimer: subscribeFormStyles.disclaimer
    }

    // Helper to create themed links for FormattedMessage
    const createLink = (chunks) => (
        <Link href="/" {...subscribeFormStyles.link}>
            {chunks}
        </Link>
    )

    const intl = useIntl()
    const {state, actions} = subscription

    const messages = {
        heading: intl.formatMessage({
            id: 'footer.subscribe.heading.stay_updated',
            defaultMessage: 'Subscribe to Stay Updated'
        }),
        description: intl.formatMessage({
            id: 'footer.subscribe.description.sign_up',
            defaultMessage: 'Be the first to know about latest offers, news, tips, and more.'
        }),
        emailAriaLabel: intl.formatMessage({
            id: 'footer.subscribe.email.assistive_msg',
            defaultMessage: 'Email address for newsletter'
        }),
        buttonSignUp: intl.formatMessage({
            id: 'footer.subscribe.button.sign_up',
            defaultMessage: 'Subscribe'
        }),
        emailPlaceholder: intl.formatMessage({
            id: 'footer.subscribe.email.placeholder_text',
            defaultMessage: 'Enter your email address...'
        })
    }

    return (
        <Box {...styles.subscribe} {...otherProps}>
            <Heading as="h2" {...styles.subscribeHeading}>
                {messages.heading}
            </Heading>
            <Text {...styles.subscribeMessage}>{messages.description}</Text>

            {state?.feedback?.message && (
                <Alert status={state.feedback.type === 'error' ? 'error' : 'success'} mb={4}>
                    <AlertIcon />
                    <AlertDescription>{state.feedback.message}</AlertDescription>
                </Alert>
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
                            if (e.key === 'Enter' && !state?.isLoading) {
                                actions?.submit?.()
                            }
                        }}
                        disabled={state?.isLoading}
                        id="subscribe-email"
                        {...styles.subscribeField}
                    />
                </InputGroup>

                <Text {...styles.subscribeDisclaimer}>
                    <FormattedMessage
                        id="footer.subscribe.disclaimer"
                        defaultMessage="By submitting this, I agree to the <terms>Terms & Conditions</terms> and <privacy>Privacy Policy</privacy>."
                        values={{
                            terms: createLink,
                            privacy: createLink
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
            feedback: PropTypes.shape({
                message: PropTypes.string,
                type: PropTypes.oneOf(['success', 'error'])
            })
        }),
        actions: PropTypes.shape({
            setEmail: PropTypes.func,
            submit: PropTypes.func
        })
    }).isRequired
}

export default SubscribeForm
