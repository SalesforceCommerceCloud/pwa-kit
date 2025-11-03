/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCallback, useMemo, useState} from 'react'
import {
    CONSENT_CHANNELS,
    CONSENT_STATUS
} from '@salesforce/retail-react-app/app/constants/marketing-consent'
import {useMarketingConsent} from '@salesforce/retail-react-app/app/hooks/use-marketing-consent'
import {useIntl} from 'react-intl'

/**
 * Hook for managing subscription form state and submission
 * @param {Object} options
 * @param {string} options.subscriptionId - The subscription ID to opt into (required)
 * @param {string} options.channel - The channel to subscribe to (email or sms)
 * @returns {Object} Subscription state and actions
 */
export const useSubscription = ({
    subscriptionId = 'newsletter', // Default subscription ID - should be configured
    channel = CONSENT_CHANNELS.EMAIL
} = {}) => {
    const {updateSubscription, isUpdating} = useMarketingConsent()
    const intl = useIntl()
    const {formatMessage} = intl

    const [email, setEmail] = useState('')
    const [message, setMessage] = useState(null)
    const [messageType, setMessageType] = useState('success')

    const EMAIL_REGEX = useMemo(
        () => /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9]+(\.[a-zA-Z0-9]+)*\.[a-zA-Z]{2,}$/,
        []
    )

    const messages = useMemo(
        () => ({
            success_confirmation: formatMessage({
                id: 'footer.success_confirmation',
                defaultMessage: 'Thanks for subscribing!'
            }),
            error: {
                enter_valid_email: formatMessage({
                    id: 'footer.error.enter_valid_email',
                    defaultMessage: 'Enter a valid email address.'
                }),
                generic_error: formatMessage({
                    id: 'footer.error.generic_error',
                    defaultMessage: "We couldn't process the subscription. Try again."
                })
            }
        }),
        [formatMessage]
    )

    const handleSignUp = useCallback(async () => {
        if (!email) {
            setMessage(messages.error.enter_valid_email)
            setMessageType('error')
            return
        }

        if (!EMAIL_REGEX.test(email)) {
            setMessage(messages.error.enter_valid_email)
            setMessageType('error')
            return
        }

        try {
            setMessage(null)

            // Submit the consent using the ShopperConsents API v1.1.3
            await updateSubscription({
                subscriptionId,
                contactPointValue: email,
                channel,
                status: CONSENT_STATUS.OPT_IN
            })

            setMessage(messages.success_confirmation)
            setMessageType('success')
            setEmail('')
        } catch (err) {
            console.error('Subscription error:', err)
            setMessage(messages.error.generic_error)
            setMessageType('error')
        }
    }, [EMAIL_REGEX, email, updateSubscription, subscriptionId, channel, messages])

    return {
        state: {
            email,
            isLoading: isUpdating,
            feedback: {message, type: messageType}
        },
        actions: {
            setEmail,
            submit: handleSignUp
        }
    }
}

export default useSubscription
