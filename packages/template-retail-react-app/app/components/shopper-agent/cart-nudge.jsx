/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useRef} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {
    getFreeShippingNudge,
    openFreeShippingSearch
} from '@salesforce/retail-react-app/app/utils/free-shipping-nudge'
import ShopperAgentWelcomeMessage from '@salesforce/retail-react-app/app/components/shopper-agent/welcome-message'

export default function CartNudge({config, siteId, position, demoMode, onDismiss, fallback}) {
    const {data: basket, isLoading} = useCurrentBasket()
    const intl = useIntl()
    const toast = useToast()
    const pending = useRef(false)
    const nudge = getFreeShippingNudge(basket, config, intl.locale)
    if (isLoading) return null
    if (!nudge) return fallback
    const message = intl.formatMessage(
        {
            id: 'shopper_agent.shipping.nudge',
            defaultMessage:
                "You're {gap} away from free shipping. Want help finding something to go with {productName}?"
        },
        nudge
    )
    return (
        <ShopperAgentWelcomeMessage
            key={`${siteId}:shipping:${nudge.key}`}
            siteId={`${siteId}:shipping:${nudge.key}`}
            message={message}
            position={position}
            demoMode={demoMode}
            dismissLabel={intl.formatMessage({
                id: 'shopper_agent.shipping.dismiss',
                defaultMessage: 'Dismiss free-shipping suggestion'
            })}
            onDismiss={onDismiss}
            onOpen={async () => {
                if (pending.current) return
                pending.current = true
                try {
                    await openFreeShippingSearch(nudge.query)
                } catch {
                    toast({
                        title: intl.formatMessage({
                            id: 'shopper_agent.shipping.error',
                            defaultMessage:
                                'Could not start the product search. Please ask the shopping agent for complementary items to reach free shipping.'
                        }),
                        status: 'error'
                    })
                } finally {
                    pending.current = false
                }
            }}
        />
    )
}
CartNudge.propTypes = {
    config: PropTypes.object.isRequired,
    siteId: PropTypes.string.isRequired,
    position: PropTypes.oneOf(['bottom-left', 'bottom-right']),
    demoMode: PropTypes.bool,
    onDismiss: PropTypes.func.isRequired,
    fallback: PropTypes.node
}
