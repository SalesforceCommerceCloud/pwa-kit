/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useMemo} from 'react'
import PropTypes from 'prop-types'
import {Alert, Box, Button, Flex, Heading, Input, Text, useSlotRecipe, Link} from '@chakra-ui/react'
import {useIntl, FormattedMessage} from 'react-intl'
import {AlertIcon} from '../icons'
import SocialIcons from '../social-icons'

const SubscribeForm = ({subscription, ...otherProps}) => {
    const recipe = useSlotRecipe({key: 'footer'})
    const intl = useIntl()
    const {formatMessage} = intl
    const {state, actions} = subscription
    const styles = recipe({alertStatus: state?.feedback?.type === 'error' ? 'error' : 'success'})

    const messages = useMemo(() => {
        const termsConditions = formatMessage({
            id: 'footer.link.terms_conditions',
            defaultMessage: 'Terms & Conditions'
        })
        const privacyPolicy = formatMessage({
            id: 'footer.link.privacy_policy',
            defaultMessage: 'Privacy Policy'
        })

        return {
            heading: formatMessage({
                id: 'footer.subscribe.heading.first_to_know',
                defaultMessage: 'Subscribe to Stay Updated'
            }),
            description: formatMessage({
                id: 'footer.subscribe.description.sign_up',
                defaultMessage: 'Be the first to know about latest offers, news, tips, and more.'
            }),
            emailAriaLabel: formatMessage({
                id: 'footer.subscribe.email.assistive_msg',
                defaultMessage: 'Email address for newsletter.'
            }),
            buttonSignUp: formatMessage({
                id: 'footer.subscribe.button.sign_up',
                defaultMessage: 'Subscribe'
            }),
            emailPlaceholderText: formatMessage({
                id: 'footer.subscribe.email.placeholder_text',
                defaultMessage: 'Enter your email address...'
            }),
            termsConditions,
            privacyPolicy,
            disclaimer: (
                <FormattedMessage
                    id="footer.subscribe.disclaimer"
                    defaultMessage="By submitting this, I agree to the {terms} and {privacy}."
                    values={{
                        terms: (
                            <Link href="/" css={styles.subscribeDisclaimerLink}>
                                {termsConditions}
                            </Link>
                        ),
                        privacy: (
                            <Link href="/" css={styles.subscribeDisclaimerLink}>
                                {privacyPolicy}
                            </Link>
                        )
                    }}
                />
            )
        }
    }, [intl, recipe])

    return (
        <Box css={styles.subscribe} {...otherProps}>
            <Heading as="h1" css={styles.subscribeHeading}>
                {messages.heading}
            </Heading>
            <Text css={styles.subscribeMessage}>{messages.description}</Text>

            {state?.feedback?.message && (
                <Alert.Root status={state.feedback.type} css={styles.subscribeAlert}>
                    <Alert.Indicator>
                        <AlertIcon css={styles.subscribeAlertIcon} />
                    </Alert.Indicator>
                    <Alert.Description css={styles.subscribeAlertDescription}>
                        {state.feedback.message}
                    </Alert.Description>
                </Alert.Root>
            )}

            <Box>
                <Flex w="full" maxW="sm">
                    <Input
                        type="email"
                        placeholder={messages.emailPlaceholderText}
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
                        css={styles.subscribeField}
                        borderEndEndRadius={0}
                        borderStartEndRadius={0}
                    />
                    <Button
                        variant="footer"
                        onClick={actions?.submit}
                        loading={state?.isLoading}
                        borderEndStartRadius={0}
                        borderStartStartRadius={0}
                    >
                        {messages.buttonSignUp}
                    </Button>
                </Flex>
                <Text css={styles.subscribeDisclaimer}>{messages.disclaimer}</Text>
            </Box>

            <SocialIcons variant="flex-start" pinterestInnerColor="black" />
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
