/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCallback, useMemo, useState} from 'react'
import {CONSENT_CHANNELS, CONSENT_STATUS, CONSENT_TAGS} from '../../../constants/marketing-consent'
import {useMarketingConsent} from '../../../hooks'
import {useIntl} from 'react-intl'

/**
 * Subscription hook for the Footer component.
 * Encapsulates validation, consent fetch/submit, and messaging.
 *
 * @param {Object} [options]
 * @param {string} [options.pageTag]
 * @param {string} [options.channel]
 * @returns {{email: string, setEmail: Function, message: string|null, messageType: 'success'|'error', isLoading: boolean, handleSignUp: Function}}
 */
export const useSubscription = ({
    pageTag = CONSENT_TAGS.HOMEPAGE_BANNER,
    channel = CONSENT_CHANNELS.EMAIL
} = {}) => {
    const {fetchConsentItems, submitConsent, isLoading} = useMarketingConsent()
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
            customerSupport: formatMessage({
                id: 'footer.column.customer_support',
                defaultMessage: 'Customer Support'
            }),
            account: formatMessage({
                id: 'footer.column.account',
                defaultMessage: 'Account'
            }),
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
                }),
                shipping: formatMessage({
                    id: 'footer.link.shipping',
                    defaultMessage: 'Shipping'
                }),
                orderStatus: formatMessage({
                    id: 'footer.link.order_status',
                    defaultMessage: 'Order Status'
                }),
                signinCreateAccount: formatMessage({
                    id: 'footer.link.signin_create_account',
                    defaultMessage: 'Sign in or create account'
                })
            },
            localeSelector: formatMessage({
                id: 'footer.locale_selector.assistive_msg',
                defaultMessage: 'Select Language'
            }),
            copyright: formatMessage({
                id: 'footer.message.copyright',
                defaultMessage:
                    'Salesforce or its affiliates. All rights reserved. This is a demo store only. Orders made WILL NOT be processed.'
            })
        }),
        [intl]
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

            const consentData = await fetchConsentItems(pageTag)
            const items = consentData.data?.filter((item) => item.tags?.includes(pageTag)) || []

            if (items.length === 0) {
                console.error('Subscription error: No subscription options available at this time')
                setMessage(messages.error.generic_error)
                setMessageType('error')
                return
            }

            const first = items[0]
            const result = await submitConsent({
                subscriptionId: first.subscriptionId,
                contactPointValue: email,
                channel,
                status: CONSENT_STATUS.OPT_IN
            })

            if (result?.status === CONSENT_STATUS.OPT_IN) {
                setMessage(messages.success_confirmation)
                setMessageType('success')
                setEmail('')
            } else {
                setMessage(messages.error.generic_error)
                setMessageType('error')
            }
        } catch (err) {
            console.error('Subscription error:', err)
            setMessage(messages.error.generic_error)
            setMessageType('error')
        }
    }, [EMAIL_REGEX, email, fetchConsentItems, submitConsent, pageTag, channel])

    return {
        state: {
            email,
            isLoading,
            feedback: {message, type: messageType}
        },
        actions: {
            setEmail,
            submit: handleSignUp
        }
    }
}
