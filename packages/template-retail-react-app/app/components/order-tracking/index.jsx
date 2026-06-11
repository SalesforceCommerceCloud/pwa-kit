/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {
    Box,
    Heading,
    Stack,
    Text,
    Link as ChakraLink
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Localized labels for the known shipping-status keys. Hoisted to module scope so
// the descriptors are allocated once (not per render); react-intl still statically
// extracts the ids because the descriptors are literals.
const SHIPPING_STATUS_MESSAGES = {
    not_shipped: {
        defaultMessage: 'Not shipped',
        id: 'account_order_detail.shipping_status.not_shipped'
    },
    part_shipped: {
        defaultMessage: 'Partially shipped',
        id: 'account_order_detail.shipping_status.part_shipped'
    },
    shipped: {
        defaultMessage: 'Shipped',
        id: 'account_order_detail.shipping_status.shipped'
    }
}

/**
 * Presentational tracking block for a single shipment on the Order Details page.
 *
 * Renders the shipping method heading, the (localized) shipping status, the
 * shipping method / provider name, and — when a tracking number is present —
 * the tracking number, hyperlinked to the carrier site when a tracking URL is
 * available (otherwise shown as plain text).
 *
 * Extracted verbatim from the former inline `renderShippingMethod` in
 * `order-detail.jsx`; the DOM it produces is intentionally identical.
 */
const OrderTracking = ({
    shippingMethodName,
    shippingStatus,
    trackingNumber,
    trackingUrl,
    shipmentsLength,
    index
}) => {
    const {formatMessage} = useIntl()

    const statusLabel = SHIPPING_STATUS_MESSAGES[shippingStatus]
        ? formatMessage(SHIPPING_STATUS_MESSAGES[shippingStatus])
        : shippingStatus

    return (
        <Stack spacing={1}>
            <Heading as="h2" fontSize="sm" pt={1}>
                {shipmentsLength > 1 ? (
                    <FormattedMessage
                        defaultMessage="Shipping Method {number}"
                        id="account_order_detail.heading.shipping_method_number"
                        values={{number: index + 1}}
                    />
                ) : (
                    <FormattedMessage
                        defaultMessage="Shipping Method"
                        id="account_order_detail.heading.shipping_method"
                    />
                )}
            </Heading>
            <Box>
                <Text fontSize="sm" textTransform="titlecase">
                    {statusLabel}
                </Text>
                <Text fontSize="sm">{shippingMethodName}</Text>
                {trackingNumber && (
                    <Text fontSize="sm">
                        <FormattedMessage
                            defaultMessage="Tracking Number"
                            id="account_order_detail.label.tracking_number"
                        />
                        :{' '}
                        {trackingUrl ? (
                            <ChakraLink href={trackingUrl} isExternal color="blue.600">
                                {trackingNumber}
                            </ChakraLink>
                        ) : (
                            trackingNumber
                        )}
                    </Text>
                )}
            </Box>
        </Stack>
    )
}

OrderTracking.propTypes = {
    /** Carrier / shipping-method display name (OMS `provider` or ECOM method name). */
    shippingMethodName: PropTypes.string,
    /** Shipping status key (`not_shipped` | `part_shipped` | `shipped`) or a raw OMS status string. */
    shippingStatus: PropTypes.string,
    /** Tracking number; when falsy, the tracking line is not rendered. */
    trackingNumber: PropTypes.string,
    /** Carrier tracking URL; when present, the tracking number is rendered as an external link. */
    trackingUrl: PropTypes.string,
    /** Total number of shipments being rendered (drives the numbered heading). */
    shipmentsLength: PropTypes.number,
    /** Zero-based index of this shipment (drives the numbered heading). */
    index: PropTypes.number
}

export default OrderTracking
