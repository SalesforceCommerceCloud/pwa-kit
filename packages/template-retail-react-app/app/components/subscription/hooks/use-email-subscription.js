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
import {validateEmail} from '@salesforce/retail-react-app/app/utils/subscription-validators'
import {useIntl} from 'react-intl'

/**
 * Hook for managing email subscription form state and submission.
 * This hook dynamically fetches all subscriptions matching a given tag and email channel,
 * then opts the user into ALL matching subscriptions when they submit their email.
 *
 * Subscriptions are fetched on-demand when the user clicks submit, not on component mount.
 *
 * This allows marketers to configure subscriptions without code changes to the storefront UI.
 *
 * @param {Object} options
 * @param {string|Array<string>} options.tag - The consent tag(s) to filter subscriptions by (e.g., CONSENT_TAGS.EMAIL_CAPTURE or [CONSENT_TAGS.EMAIL_CAPTURE, CONSENT_TAGS.ACCOUNT])
 * @returns {Object} Email subscription state and actions
 * @returns {Object} return.state - Current form state
 * @returns {string} return.state.email - Current email value
 * @returns {boolean} return.state.isLoading - Whether submission is in progress
 * @returns {Object} return.state.feedback - Feedback message and type
 * @returns {string} return.state.feedback.message - User-facing message
 * @returns {string} return.state.feedback.type - Message type ('success' | 'error')
 * @returns {Object} return.actions - Available actions
 * @returns {Function} return.actions.setEmail - Update email value
 * @returns {Function} return.actions.submit - Submit the subscription
 *
 * @example
 * const {state, actions} = useEmailSubscription({
 *   tag: CONSENT_TAGS.EMAIL_CAPTURE
 * })
 */
export const useEmailSubscription = ({tag} = {}) => {
    // Normalize tag to array for API call
    const tags = useMemo(() => {
        if (!tag) return []
        return Array.isArray(tag) ? tag : [tag]
    }, [tag])

    const {
        refetch: fetchSubscriptions,
        updateSubscriptions,
        isUpdating
    } = useMarketingConsent({
        tags,
        enabled: false
    })

    const intl = useIntl()
    const {formatMessage} = intl

    const [email, setEmail] = useState('')
    const [message, setMessage] = useState(null)
    const [messageType, setMessageType] = useState('success')

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
        // Validate email using the utility validator
        const validation = validateEmail(email)

        if (!validation.valid) {
            setMessage(messages.error.enter_valid_email)
            setMessageType('error')
            return
        }

        try {
            setMessage(null)

            // Fetch subscriptions on-demand when submitting
            const {data: freshSubscriptionsData} = await fetchSubscriptions()
            const allSubscriptions = freshSubscriptionsData?.data || []

            // Find matching subscriptions
            const matchingSubs = allSubscriptions.filter((sub) => {
                const hasEmailChannel = sub.channels?.includes(CONSENT_CHANNELS.EMAIL)
                const hasAnyTag = tags.some((t) => sub.tags?.includes(t))
                return hasEmailChannel && hasAnyTag
            })

            // Check if there are any matching subscriptions
            if (matchingSubs.length === 0) {
                const tagList = tags.join(', ')
                console.error(
                    `[useEmailSubscription] No subscriptions found for tag(s) "${tagList}" and channel "${CONSENT_CHANNELS.EMAIL}".`
                )
                setMessage(messages.error.generic_error)
                setMessageType('error')
                return
            }

            // Build array of subscription updates for ALL matching subscriptions
            const subscriptionUpdates = matchingSubs.map((sub) => ({
                subscriptionId: sub.subscriptionId,
                contactPointValue: email,
                channel: CONSENT_CHANNELS.EMAIL,
                status: CONSENT_STATUS.OPT_IN
            }))

            console.log(
                `[useEmailSubscription] Opting in to ${subscriptionUpdates.length} subscription(s):`,
                subscriptionUpdates.map((s) => s.subscriptionId)
            )

            // Submit the consent using Shopper Consents Bulk API
            await updateSubscriptions(subscriptionUpdates)

            setMessage(messages.success_confirmation)
            setMessageType('success')
            setEmail('')
        } catch (err) {
            console.error('[useEmailSubscription] Subscription error:', err)
            setMessage(messages.error.generic_error)
            setMessageType('error')
        }
    }, [email, tags, fetchSubscriptions, updateSubscriptions, messages])

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

export default useEmailSubscription
