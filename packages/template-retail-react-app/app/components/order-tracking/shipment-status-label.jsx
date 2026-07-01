/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'

/**
 * Resolves a shipping-status key (`not_shipped` | `part_shipped` | `shipped`) to its
 * localized label. A raw/unknown status is returned verbatim (callers apply
 * `textTransform="capitalize"` so a snake_case fallback still reads cleanly). Shared by
 * the per-shipment box header and the tracking card so the same order never shows a
 * localized status in one place and a raw token in another.
 *
 * The descriptors are inline literals so babel-plugin-formatjs can statically extract
 * the ids (a hoisted/variable descriptor is NOT extracted).
 *
 * @param {string|undefined} status - The shipping status key (or a raw status string)
 * @param {ReturnType<typeof useIntl>['formatMessage']} formatMessage - react-intl formatter
 * @returns {string|undefined} The localized label, or the raw status when unmapped
 */
export const formatShipmentStatus = (status, formatMessage) =>
    ({
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
    }[status] || status)

/**
 * Renders a shipping status as localized text. Returns null for an empty status so the
 * caller can omit the surrounding element entirely.
 */
const ShipmentStatusLabel = ({status}) => {
    const {formatMessage} = useIntl()
    const trimmed = typeof status === 'string' ? status.trim() : ''
    if (!trimmed) return null
    return <>{formatShipmentStatus(trimmed, formatMessage)}</>
}

ShipmentStatusLabel.propTypes = {
    /** Shipping status key (`not_shipped` | `part_shipped` | `shipped`) or a raw status string. */
    status: PropTypes.string
}

export default ShipmentStatusLabel
