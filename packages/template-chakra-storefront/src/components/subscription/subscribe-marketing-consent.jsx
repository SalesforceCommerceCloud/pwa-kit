/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import SubscribeForm from './subscribe-form'
import useSubscription from './use-subscription'

const SubscribeMarketingConsent = (props) => {
    const {state, actions} = useSubscription()
    return <SubscribeForm subscription={{state, actions}} {...props} />
}

export default SubscribeMarketingConsent
