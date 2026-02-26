/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useRef, useEffect} from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Flex,
    Text,
    Heading,
    Input,
    Button,
    Alert,
    AlertIcon,
    AlertDescription,
    Link,
    useMultiStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useIntl, FormattedMessage} from 'react-intl'
import SocialIcons from '@salesforce/retail-react-app/app/components/social-icons'
import {isValidEmail} from '@salesforce/retail-react-app/app/utils/email-utils'

const SubscribeForm = ({
    form,
    onSubmit,
    successMessage,
    errors = {},
    isSubmitting = false,
    ...otherProps
}) => {
    const styles = useMultiStyleConfig('SubscribeForm')

    const createLink = (chunks) => (
        <Link href="/" {...styles.link}>
            {chunks}
        </Link>
    )

    const intl = useIntl()
    const {register} = form

    const prevSubmittingRef = useRef(false)
    useEffect(() => {
        if (prevSubmittingRef.current && !isSubmitting) {
            form.setFocus('email')
        }
        prevSubmittingRef.current = isSubmitting
    }, [isSubmitting, form])

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
        }),
        emailValidation: intl.formatMessage({
            id: 'footer.error.enter_valid_email',
            defaultMessage: 'Enter a valid email address.'
        })
    }

    const errorMessage = errors?.email?.message
    const feedbackMessage = errorMessage || successMessage
    const feedbackType = errorMessage ? 'error' : 'success'

    return (
        <Box {...styles.container} {...otherProps}>
            <Heading as="h2" {...styles.heading}>
                {messages.heading}
            </Heading>
            <Text {...styles.message}>{messages.description}</Text>

            {feedbackMessage && (
                <Alert status={feedbackType} mb={4}>
                    <AlertIcon />
                    <AlertDescription>{feedbackMessage}</AlertDescription>
                </Alert>
            )}

            <Box as="form" onSubmit={onSubmit} noValidate>
                <Flex>
                    <Input
                        type="email"
                        placeholder={messages.emailPlaceholder}
                        aria-label={messages.emailAriaLabel}
                        disabled={isSubmitting}
                        id="subscribe-email"
                        {...register('email', {
                            required: messages.emailValidation,
                            validate: (v) => isValidEmail(v) || messages.emailValidation
                        })}
                        {...styles.field}
                    />
                    <Button
                        type="submit"
                        variant="footer"
                        isLoading={isSubmitting}
                        loadingText={messages.buttonSignUp}
                        {...styles.button}
                    >
                        {messages.buttonSignUp}
                    </Button>
                </Flex>

                <Text {...styles.disclaimer}>
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
    form: PropTypes.object.isRequired,
    onSubmit: PropTypes.func.isRequired,
    successMessage: PropTypes.string,
    errors: PropTypes.object,
    isSubmitting: PropTypes.bool
}

export default SubscribeForm
