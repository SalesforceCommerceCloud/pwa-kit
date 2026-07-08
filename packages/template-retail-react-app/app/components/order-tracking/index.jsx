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
    Stack,
    Text,
    Link as ChakraLink
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {ensureExternalUrl} from '@salesforce/retail-react-app/app/utils/url'
import {formatShipmentStatus} from '@salesforce/retail-react-app/app/components/order-tracking/shipment-status-label'

/**
 * Presentational per-shipment tracking card on the Order Details page.
 *
 * Renders one bordered card containing the carrier / shipping-method name, the
 * localized shipping status, the tracking number (hyperlinked to the carrier
 * site when a tracking URL is available, otherwise plain text), and — when
 * present — the expected and actual delivery dates. The card carries NO shipping
 * address: addresses are rendered separately at order level, because a tracking
 * entry cannot be reliably tied to a specific shipment (the multi-shipment view is
 * a flat list with no address association).
 *
 * Note: the OMS-over-ECOM fallback for the shipment fields lives at the call
 * site in `order-detail.jsx` (the component receives already-resolved scalar
 * props), and the caller renders one card per entry of a single flat list — never
 * a positional OMS↔ECOM index-join.
 */
const OrderTracking = ({
    shippingMethodName,
    shippingStatus,
    trackingNumber,
    trackingUrl,
    expectedDeliveryDate,
    actualDeliveryDate
}) => {
    const {formatMessage, formatDate} = useIntl()

    // Same date format the order header uses for "Ordered:" — e.g. "Jun 12, 2026".
    // Returns null for missing, null, or malformed values so the caller can omit the
    // line entirely. The `!value` guard is load-bearing: `new Date(null)` returns the
    // epoch (1970-01-01), NOT an Invalid Date, so without it a null delivery date would
    // render "31 Dec 1969" to the shopper. A truthy-but-unparseable string is caught by
    // the isNaN check.
    const formatTrackingDate = (value) => {
        if (!value) return null
        const date = new Date(value)
        if (isNaN(date.getTime())) return null
        // Defensive guard against an epoch-era SOM sentinel: a truthy date string like
        // "1970-01-01T00:00:00Z" parses to a valid Date and would render "1 Jan 1970".
        // (The `!value` guard above already covers null/0/""; JS parses "0" as year 2000,
        // not the epoch, so this specifically catches truthy 1970-era strings.) SOM does
        // not currently send such a sentinel — this is cheap insurance if it ever does.
        if (date.getUTCFullYear() <= 1970) return null
        return formatDate(date, {year: 'numeric', month: 'short', day: 'numeric'})
    }

    const expectedDeliveryLabel = formatTrackingDate(expectedDeliveryDate)
    const actualDeliveryLabel = formatTrackingDate(actualDeliveryDate)

    // External href, else plain text: "www.carrier.com" -> "https://www.carrier.com/" (unsafe/relative -> undefined)
    const trackingHref = ensureExternalUrl(trackingUrl)

    return (
        <Box
            border="1px solid"
            borderColor="gray.100"
            borderRadius="base"
            p={4}
            data-testid="order-tracking-card"
        >
            <Stack spacing={1}>
                <Text fontSize="sm" textTransform="capitalize">
                    {formatShipmentStatus(shippingStatus, formatMessage)}
                </Text>
                {shippingMethodName && (
                    <Text fontSize="sm" fontWeight="medium">
                        {shippingMethodName}
                    </Text>
                )}
                {trackingNumber && (
                    <Text fontSize="sm">
                        <FormattedMessage
                            defaultMessage="Tracking Number"
                            id="account_order_detail.label.tracking_number"
                        />
                        :{' '}
                        {trackingHref ? (
                            <ChakraLink
                                href={trackingHref}
                                isExternal
                                rel="noopener noreferrer"
                                color="blue.600"
                            >
                                {trackingNumber}
                            </ChakraLink>
                        ) : (
                            trackingNumber
                        )}
                    </Text>
                )}
                {expectedDeliveryLabel && (
                    <Text fontSize="sm">
                        <FormattedMessage
                            defaultMessage="Expected delivery"
                            id="account_order_detail.label.expected_delivery"
                        />
                        : {expectedDeliveryLabel}
                    </Text>
                )}
                {actualDeliveryLabel && (
                    <Text fontSize="sm">
                        {/* id is `delivered_on` (mirrors SFN's deliveredOn) but the label is
                            just "Delivered"; the date follows after the colon, not inside the message. */}
                        <FormattedMessage
                            defaultMessage="Delivered"
                            id="account_order_detail.label.delivered_on"
                        />
                        : {actualDeliveryLabel}
                    </Text>
                )}
            </Stack>
        </Box>
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
    actualDeliveryDate: PropTypes.string
}

export default OrderTracking
