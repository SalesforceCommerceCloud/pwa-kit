/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCallback, useEffect, useMemo, useState} from 'react'
import {useForm} from 'react-hook-form'
import {
    CONSENT_CHANNELS,
    CONSENT_STATUS
} from '@salesforce/retail-react-app/app/constants/marketing-consent'
import {useMarketingConsent} from '@salesforce/retail-react-app/app/hooks/use-marketing-consent'
import {useIntl} from 'react-intl'

/**
 * Hook for managing email subscription form state and submission.
 * Uses react-hook-form for form state, validation, and submission — consistent
 * with other forms in the app (e.g., promo code, login, registration).
 *
 * Subscriptions are fetched on-demand when the user submits, not on mount.
 *
 * @param {Object} options
 * @param {string|Array<string>} options.tag - The consent tag(s) to filter subscriptions by
 * @returns {Object} Form object, submit handler, and feedback
 * @returns {Object} return.form - react-hook-form form object
 * @returns {Function} return.onSubmit - Submit handler (pass to form onSubmit)
 * @returns {string|null} return.successMessage - Success feedback message (null when none)
 * @returns {Object} return.errors - react-hook-form errors (subscribed for re-renders)
 * @returns {boolean} return.isSubmitting - Whether the form is currently submitting
 */
export const useEmailSubscription = ({tag} = {}) => {
    const tags = useMemo(() => {
        if (!tag) return []
        return Array.isArray(tag) ? tag : [tag]
    }, [tag])

    const {
        refetch: fetchSubscriptions,
        updateSubscriptions,
        isFeatureEnabled
    } = useMarketingConsent({
        tags,
        enabled: false
    })

    const {formatMessage} = useIntl()

    const form = useForm({defaultValues: {email: ''}, reValidateMode: 'onSubmit'})
    const [successMessage, setSuccessMessage] = useState(null)

    // Clear all feedback (success message + validation errors) when the user types.
    // Prevents stale messages from a previous submission from lingering.
    useEffect(() => {
        const {unsubscribe} = form.watch((_, {name}) => {
            if (name === 'email') {
                setSuccessMessage(null)
                form.clearErrors('email')
            }
        })
        return () => unsubscribe()
    }, [form])

    const messages = useMemo(
        () => ({
            success: formatMessage({
                id: 'footer.success_confirmation',
                defaultMessage: 'Thanks for subscribing!'
            }),
            genericError: formatMessage({
                id: 'footer.error.generic_error',
                defaultMessage: "We couldn't process the subscription. Try again."
            })
        }),
        [formatMessage]
    )

    const submitSubscription = useCallback(
        async ({email}) => {
            setSuccessMessage(null)

            try {
                const {data: freshSubscriptionsData} = await fetchSubscriptions()
                const allSubscriptions = freshSubscriptionsData?.data || []

                const matchingSubs = allSubscriptions.filter((sub) => {
                    const hasEmailChannel = sub.channels?.includes(CONSENT_CHANNELS.EMAIL)
                    const hasAnyTag = tags.some((t) => sub.tags?.includes(t))
                    return hasEmailChannel && hasAnyTag
                })

                if (matchingSubs.length === 0) {
                    const tagList = tags.join(', ')
                    console.error(
                        `[useEmailSubscription] No subscriptions found for tag(s) "${tagList}" and channel "${CONSENT_CHANNELS.EMAIL}".`
                    )
                    form.setError('email', {
                        type: 'server',
                        message: messages.genericError
                    })
                    return
                }

                const subscriptionUpdates = matchingSubs.map((sub) => ({
                    subscriptionId: sub.subscriptionId,
                    contactPointValue: email,
                    channel: CONSENT_CHANNELS.EMAIL,
                    status: CONSENT_STATUS.OPT_IN
                }))

                await updateSubscriptions(subscriptionUpdates)

                setSuccessMessage(messages.success)
                form.reset()
            } catch (err) {
                console.error('[useEmailSubscription] Subscription error:', err)
                form.setError('email', {type: 'server', message: messages.genericError})
            }
        },
        [tags, fetchSubscriptions, updateSubscriptions, messages, form]
    )

    // Subscribe to formState so the hook re-renders when errors/isSubmitting change.
    // Required by react-hook-form's Proxy-based formState.
    const {errors, isSubmitting} = form.formState

    const onSubmit = isFeatureEnabled
        ? form.handleSubmit(submitSubscription)
        : (e) => {
              if (e?.preventDefault) e.preventDefault()
          }

    return {form, onSubmit, successMessage, errors, isSubmitting}
}

export default useEmailSubscription
