/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import SubscribeForm from '@salesforce/retail-react-app/app/components/subscription/subscribe-form'
import {useEmailSubscription} from '@salesforce/retail-react-app/app/components/subscription/hooks/use-email-subscription'
import {CONSENT_TAGS} from '@salesforce/retail-react-app/app/constants/marketing-consent'

/**
 * Marketing consent subscription component for email subscriptions.
 * This component dynamically fetches all subscriptions matching a given consent tag
 * and email channel, then opts the user into ALL matching subscriptions.
 *
 * This allows marketers to configure subscriptions without code changes to the storefront UI.
 *
 * Subscriptions are fetched only when the user submits the form, keeping the initial page load lightweight.
 *
 * @param {Object} props
 * @param {string|Array<string>} props.tag - The consent tag(s) to filter subscriptions by (e.g., CONSENT_TAGS.EMAIL_CAPTURE or [CONSENT_TAGS.EMAIL_CAPTURE, CONSENT_TAGS.ACCOUNT])
 *
 * @example
 * // In footer
 * <SubscribeMarketingConsent tag={CONSENT_TAGS.EMAIL_CAPTURE} />
 *
 * // Multiple tags
 * <SubscribeMarketingConsent tag={[CONSENT_TAGS.EMAIL_CAPTURE, CONSENT_TAGS.ACCOUNT]} />
 *
 * // On registration page
 * <SubscribeMarketingConsent tag={CONSENT_TAGS.REGISTRATION} />
 */
const SubscribeMarketingConsent = ({tag = CONSENT_TAGS.EMAIL_CAPTURE, ...props}) => {
    const subscription = useEmailSubscription({tag})
    return <SubscribeForm {...subscription} {...props} />
}

SubscribeMarketingConsent.propTypes = {
    tag: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)])
}

export default SubscribeMarketingConsent
