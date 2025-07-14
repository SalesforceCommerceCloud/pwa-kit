/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {forwardRef, useRef} from 'react'
import {Box, Heading, Skeleton as ChakraSkeleton} from '@chakra-ui/react'
import {FormattedMessage} from 'react-intl'
import {useCurrentCustomer} from '../../../hooks'

/**
 * This is a specialized Skeleton component that which uses the customers authtype as the
 * `isLoaded` state. It also will revert it's provided size (height, width) when the loaded
 * state changes. This allows you to have skeletons of a specific size, but onece loaded
 * the bounding element will affect the contents size.
 */
// eslint-disable-next-line react/prop-types
const Skeleton = forwardRef(({children, height, width, ...rest}, ref) => {
    const {data: customer} = useCurrentCustomer()
    const {isRegistered} = customer
    const size = !isRegistered
        ? {
              height,
              width
          }
        : {}
    return (
        <ChakraSkeleton ref={ref} isLoaded={!customer.isLoading} {...rest} {...size}>
            {children}
        </ChakraSkeleton>
    )
})

Skeleton.displayName = 'Skeleton'

export const MarketingConsentCard = () => {
    const headingRef = useRef(null)
    return (
        <Box layerStyle="cardBordered" p={6}>
            <Skeleton ref={headingRef} marginBottom={6}>
                <Heading as="h3" fontSize="lg">
                    <FormattedMessage
                        defaultMessage="Messaging Preferences"
                        id="consent_card.title.my_communications"
                    />
                </Heading>
            </Skeleton>
        </Box>
    )
}
