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
 * This allows marketers to configure subscriptions in Business Manager without code changes.
 *
 * @param {Object} options
 * @param {string|Array<string>} options.tag - The consent tag(s) to filter subscriptions by (e.g., CONSENT_TAGS.EMAIL_CAPTURE or [CONSENT_TAGS.EMAIL_CAPTURE, CONSENT_TAGS.ACCOUNT])
 * @returns {Object} Email subscription state and actions
 * @returns {Object} return.state - Current form state
 * @returns {string} return.state.email - Current email value
 * @returns {boolean} return.state.isLoading - Whether submission is in progress
 * @returns {boolean} return.state.isFetching - Whether subscriptions are being fetched
 * @returns {Object} return.state.feedback - Feedback message and type
 * @returns {string} return.state.feedback.message - User-facing message
 * @returns {string} return.state.feedback.type - Message type ('success' | 'error')
 * @returns {number} return.state.matchingSubscriptionsCount - Number of subscriptions that will be opted into
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
        data: subscriptionsData,
        isLoading: isFetchingSubscriptions,
        updateSubscriptions,
        isUpdating
    } = useMarketingConsent({tags})

    const intl = useIntl()
    const {formatMessage} = intl

    const [email, setEmail] = useState('')
    const [message, setMessage] = useState(null)
    const [messageType, setMessageType] = useState('success')

    // Find all subscriptions that match the tag(s) and email channel
    // Since the API already filters by tags, we need to match against any of the provided tags
    const matchingSubscriptions = useMemo(() => {
        if (tags.length === 0 || !subscriptionsData) {
            return []
        }
        const allSubscriptions = subscriptionsData?.data || []
        return allSubscriptions.filter((sub) => {
            // Check if channel (singular) matches email
            const hasEmailChannel = sub.channel === CONSENT_CHANNELS.EMAIL

            // Check if tags array includes any of the requested tags
            const hasAnyTag = tags.some((t) => sub.tags?.includes?.(t))

            return hasEmailChannel && hasAnyTag
        })
    }, [tags, subscriptionsData])

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
                no_subscriptions: formatMessage({
                    id: 'footer.error.no_subscriptions',
                    defaultMessage: 'No subscriptions available. Please try again later.'
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

        // Check if there are any matching subscriptions
        if (matchingSubscriptions.length === 0) {
            const tagList = tags.join(', ')
            console.error(
                `[useEmailSubscription] No subscriptions found for tag(s) "${tagList}" and channel "email". ` +
                    `Please configure subscriptions in Business Manager with one of these tags: ${tagList}.`
            )
            setMessage(messages.error.no_subscriptions)
            setMessageType('error')
            return
        }

        try {
            setMessage(null)

            // Build array of subscription updates for ALL matching subscriptions
            const subscriptionUpdates = matchingSubscriptions.map((sub) => ({
                subscriptionId: sub.subscriptionId,
                contactPointValue: email,
                channel: CONSENT_CHANNELS.EMAIL,
                status: CONSENT_STATUS.OPT_IN
            }))

            console.log(
                `[useEmailSubscription] Opting in to ${subscriptionUpdates.length} subscription(s):`,
                subscriptionUpdates.map((s) => s.subscriptionId)
            )

            // Submit the consent using bulk API (ShopperConsents API v1.1.3)
            await updateSubscriptions(subscriptionUpdates)

            setMessage(messages.success_confirmation)
            setMessageType('success')
            setEmail('')
        } catch (err) {
            console.error('[useEmailSubscription] Subscription error:', err)
            setMessage(messages.error.generic_error)
            setMessageType('error')
        }
    }, [email, matchingSubscriptions, updateSubscriptions, tag, messages])

    return {
        state: {
            email,
            isLoading: isUpdating,
            isFetching: isFetchingSubscriptions,
            feedback: {message, type: messageType},
            matchingSubscriptionsCount: matchingSubscriptions.length
        },
        actions: {
            setEmail,
            submit: handleSignUp
        }
    }
}

export default useEmailSubscription
