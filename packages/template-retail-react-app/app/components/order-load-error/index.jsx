/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {FormattedMessage} from 'react-intl'
import {
    Box,
    Button,
    Heading,
    Stack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import Link from '@salesforce/retail-react-app/app/components/link'
import {ChevronLeftIcon} from '@salesforce/retail-react-app/app/components/icons'

/**
 * Full-card error state for the Order Details page, shown when the order fetch
 * fails (or otherwise can't be displayed). Mirrors the storefront-next
 * `OrderNotFoundCard`: a square-cornered card with a title, a muted description,
 * and a "Back to Order History" action.
 *
 * Rendered in place of the order detail when `useOrder` reports an error, so a
 * failed fetch no longer hangs on the loading skeleton forever.
 */
const OrderLoadError = () => {
    return (
        <Stack
            spacing={4}
            data-testid="account-order-details-error"
            layerStyle="cardBordered"
            // Square corners to match the MarketStreet design (no rounded radius).
            borderRadius="0"
            alignItems="center"
            textAlign="center"
            py={[8, 12]}
        >
            <Box>
                <Heading as="h1" fontSize={['lg', '2xl']}>
                    <FormattedMessage
                        defaultMessage="Order Not Found"
                        id="account_order_detail.error.title"
                    />
                </Heading>
                <Text fontSize="sm" color="gray.600" pt={2}>
                    <FormattedMessage
                        defaultMessage="We couldn't find the order you're looking for."
                        id="account_order_detail.error.description"
                    />
                </Text>
            </Box>
            <Button as={Link} to="/account/orders" variant="solid" leftIcon={<ChevronLeftIcon />}>
                <FormattedMessage
                    defaultMessage="Back to Order History"
                    id="account_order_detail.error.back_to_history"
                />
            </Button>
        </Stack>
    )
}

export default OrderLoadError
