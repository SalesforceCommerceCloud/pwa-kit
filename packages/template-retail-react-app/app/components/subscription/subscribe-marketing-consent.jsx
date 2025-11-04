/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import SubscribeForm from './subscribe-form'
import {useEmailSubscription} from './hooks'
import {CONSENT_TAGS} from '@salesforce/retail-react-app/app/constants/marketing-consent'

/**
 * Marketing consent subscription component for email subscriptions.
 * This component dynamically fetches all subscriptions matching a given consent tag
 * and email channel, then opts the user into ALL matching subscriptions.
 * 
 * This allows marketers to configure subscriptions in Business Manager without code changes.
 *
 * @param {Object} props
 * @param {string} props.tag - The consent tag to filter subscriptions by (e.g., CONSENT_TAGS.HOMEPAGE_BANNER)
 * 
 * @example
 * // In footer
 * <SubscribeMarketingConsent tag={CONSENT_TAGS.HOMEPAGE_BANNER} />
 * 
 * // On registration page
 * <SubscribeMarketingConsent tag={CONSENT_TAGS.REGISTRATION} />
 */
const SubscribeMarketingConsent = ({tag = CONSENT_TAGS.FOOTER, ...props}) => {
    const {state, actions} = useEmailSubscription({tag})
    return <SubscribeForm subscription={{state, actions}} {...props} />
}

SubscribeMarketingConsent.propTypes = {
    tag: PropTypes.string.isRequired
}

export default SubscribeMarketingConsent
