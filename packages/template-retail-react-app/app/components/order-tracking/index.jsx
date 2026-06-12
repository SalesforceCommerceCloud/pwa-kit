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

/**
 * Presentational tracking block for a single shipment on the Order Details page.
 *
 * Renders the shipping method heading, the (localized) shipping status, the
 * shipping method / provider name, the tracking number (hyperlinked to the
 * carrier site when a tracking URL is available, otherwise plain text), and —
 * when present — the expected and actual delivery dates.
 *
 * Note: the OMS-over-ECOM fallback for the shipment fields lives at the call
 * sites in `order-detail.jsx` (the component receives already-resolved scalar
 * props). A future WI may centralize that fallback into a normalized-shipment
 * helper if more call sites are added.
 */
const OrderTracking = ({
    shippingMethodName,
    shippingStatus,
    trackingNumber,
    trackingUrl,
    expectedDeliveryDate,
    actualDeliveryDate,
    shipmentsLength,
    index
}) => {
    const {formatMessage, formatDate} = useIntl()

    // Same date format the order header uses for "Ordered:" — e.g. "Jun 12, 2026".
    const formatTrackingDate = (value) =>
        formatDate(new Date(value), {year: 'numeric', month: 'short', day: 'numeric'})

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
                    {/* Inline literal descriptors so babel-plugin-formatjs can statically
                        extract these ids (a hoisted/variable descriptor is NOT extracted). */}
                    {{
                        not_shipped: formatMessage({
                            defaultMessage: 'Not shipped',
                            id: 'account_order_detail.shipping_status.not_shipped'
                        }),
                        part_shipped: formatMessage({
                            defaultMessage: 'Partially shipped',
                            id: 'account_order_detail.shipping_status.part_shipped'
                        }),
                        shipped: formatMessage({
                            defaultMessage: 'Shipped',
                            id: 'account_order_detail.shipping_status.shipped'
                        })
                    }[shippingStatus] || shippingStatus}
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
                {expectedDeliveryDate && (
                    <Text fontSize="sm">
                        <FormattedMessage
                            defaultMessage="Expected delivery"
                            id="account_order_detail.label.expected_delivery"
                        />
                        : {formatTrackingDate(expectedDeliveryDate)}
                    </Text>
                )}
                {actualDeliveryDate && (
                    <Text fontSize="sm">
                        {/* id is `delivered_on` (mirrors SFN's deliveredOn) but the label is
                            just "Delivered"; the date follows after the colon, not inside the message. */}
                        <FormattedMessage
                            defaultMessage="Delivered"
                            id="account_order_detail.label.delivered_on"
                        />
                        : {formatTrackingDate(actualDeliveryDate)}
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
    /** Expected delivery date (ISO string); when present, renders an "Expected delivery: <date>" line. */
    expectedDeliveryDate: PropTypes.string,
    /** Actual delivery date (ISO string); when present, renders a "Delivered: <date>" line. */
    actualDeliveryDate: PropTypes.string,
    /** Total number of shipments being rendered (drives the numbered heading). */
    shipmentsLength: PropTypes.number,
    /** Zero-based index of this shipment (drives the numbered heading). */
    index: PropTypes.number
}

export default OrderTracking
