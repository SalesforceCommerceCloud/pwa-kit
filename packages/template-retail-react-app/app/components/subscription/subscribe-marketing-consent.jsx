/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import SubscribeForm from './subscribe-form'
import useSubscription from '@salesforce/retail-react-app/app/hooks/use-subscription'
import {CONSENT_CHANNELS} from '@salesforce/retail-react-app/app/constants/marketing-consent'

/**
 * Marketing consent subscription component for the footer
 * This component integrates the subscription form with the ShopperConsents API
 *
 * @param {Object} props
 * @param {string} props.subscriptionId - The subscription ID configured in your consent management
 * @param {string} props.channel - The channel to subscribe to (email or sms)
 */
const SubscribeMarketingConsent = ({
    subscriptionId = 'newsletter',
    channel = CONSENT_CHANNELS.EMAIL,
    ...props
}) => {
    const {state, actions} = useSubscription({subscriptionId, channel})
    return <SubscribeForm subscription={{state, actions}} {...props} />
}

SubscribeMarketingConsent.propTypes = {
    subscriptionId: PropTypes.string,
    channel: PropTypes.oneOf(['email', 'sms'])
}

export default SubscribeMarketingConsent
