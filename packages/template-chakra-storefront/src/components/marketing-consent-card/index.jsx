/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {forwardRef, useRef} from 'react'
import {Skeleton as ChakraSkeleton} from '@chakra-ui/react'
import {FormattedMessage} from 'react-intl'
import {useCurrentCustomer} from '../../hooks'
import {ToggleCard} from '../toggle-card'

// eslint-disable-next-line react/prop-types
const Skeleton = forwardRef(({children, ...rest}, ref) => {
    const {isLoading} = useCurrentCustomer()
    return (
        // todo: switch this from `customer.isLoading` to shopper-consent query in-progress.
        <ChakraSkeleton ref={ref} isLoaded={!isLoading} {...rest}>
            {children}
        </ChakraSkeleton>
    )
})

Skeleton.displayName = 'Skeleton'

export const MarketingConsentCard = () => {
    const headingRef = useRef(null)
    return (
        <ToggleCard
            id="password"
            title={
                <Skeleton ref={headingRef}>
                    <FormattedMessage
                        defaultMessage="Messaging Preferences"
                        id="consent_card.title.my_communications"
                    />
                </Skeleton>
            }
            layerStyle="cardBordered"
        />
    )
}
