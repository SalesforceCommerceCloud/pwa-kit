/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {forwardRef} from 'react'
import {Box, Skeleton as ChakraSkeleton, Heading} from '@chakra-ui/react'
import {FormattedMessage} from 'react-intl'
import {useCurrentCustomer} from '../../hooks'

// eslint-disable-next-line react/prop-types
const Skeleton = forwardRef(({children, ...rest}, ref) => {
    const {isPending} = useCurrentCustomer()
    return (
        // todo: switch this from `customer.isLoading` to shopper-consent query in-progress.
        <ChakraSkeleton ref={ref} loading={isPending} {...rest}>
            {children}
        </ChakraSkeleton>
    )
})

Skeleton.displayName = 'Skeleton'

const MarketingConsentCard = () => {
    return (
        <Box layerStyle="cardBordered" data-testid="marketing-consent-card" padding="4">
            <Skeleton>
                <Heading as="h2" fontSize="lg">
                    <FormattedMessage
                        defaultMessage="Marketing Communication Preferences"
                        id="consent_card.title.my_communications"
                    />
                </Heading>
            </Skeleton>
        </Box>
    )
}

export default MarketingConsentCard
