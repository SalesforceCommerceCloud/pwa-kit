/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useMemo} from 'react'
import {defineMessages, useIntl} from 'react-intl'
import {Badge, Flex} from '@salesforce/retail-react-app/app/components/shared/ui'
import {CloseIcon} from '@salesforce/retail-react-app/app/components/icons'
import {
    getOrderDisplayStatus,
    isReturnDisplayStatus,
    ORDER_DISPLAY_STATUS
} from '@salesforce/retail-react-app/app/utils/order-status-utils'
import PropTypes from 'prop-types'

// Localized labels for the four return display statuses, keyed by ORDER_DISPLAY_STATUS so the badge
// can look up its label by status. Returns render in a neutral badge (no color/icon) — cancelled
// remains the only colored terminal state, matching the Storefront-Next order-management UX.
const RETURN_STATUS_BADGE_MESSAGES = defineMessages({
    [ORDER_DISPLAY_STATUS.RETURN_INITIATED]: {
        defaultMessage: 'Return Initiated',
        id: 'order_status_badge.label.return_initiated'
    },
    [ORDER_DISPLAY_STATUS.PARTIAL_RETURN_INITIATED]: {
        defaultMessage: 'Partial Return Initiated',
        id: 'order_status_badge.label.partial_return_initiated'
    },
    [ORDER_DISPLAY_STATUS.RETURN_COMPLETE]: {
        defaultMessage: 'Return Complete',
        id: 'order_status_badge.label.return_complete'
    },
    [ORDER_DISPLAY_STATUS.PARTIAL_RETURN_COMPLETE]: {
        defaultMessage: 'Partial Return Complete',
        id: 'order_status_badge.label.partial_return_complete'
    }
})

/**
 * Displays an order-level status badge. Derives cancelled and return states from item-level
 * omsData.status via getOrderDisplayStatus (OMS-only); pure ECOM orders fall through to the raw
 * order.status string in a green badge.
 *
 * Precedence: cancelled (red, the only terminal colored state) wins over any return state. Return
 * states render in a neutral gray badge with their own localized label. When a return was just
 * submitted (returnFeedback success) and the order's own items do not yet reflect it, the badge
 * optimistically shows the generic "Return Initiated" until the next refetch reconciles the true
 * partial-vs-full state.
 */
const OrderStatusBadge = ({order, cancelFeedback, returnFeedback}) => {
    const {formatMessage} = useIntl()

    const isCancelled = useMemo(
        () =>
            cancelFeedback?.status === 'success' ||
            getOrderDisplayStatus(order) === ORDER_DISPLAY_STATUS.CANCELLED,
        [cancelFeedback?.status, order]
    )

    // Return status, gated so cancelled always wins. The order's real return status (from its items)
    // takes precedence over the optimistic just-submitted state, so a more-accurate partial/complete
    // label is never masked by the generic optimistic one.
    const returnDisplayStatus = useMemo(() => {
        if (isCancelled) return null
        const orderDisplayStatus = getOrderDisplayStatus(order)
        if (isReturnDisplayStatus(orderDisplayStatus)) return orderDisplayStatus
        if (returnFeedback?.status === 'success') return ORDER_DISPLAY_STATUS.RETURN_INITIATED
        return null
    }, [isCancelled, order, returnFeedback?.status])

    return (
        <Badge
            colorScheme={isCancelled ? 'red' : returnDisplayStatus ? 'gray' : 'green'}
            textTransform="capitalize"
        >
            {isCancelled ? (
                <Flex display="inline-flex" alignItems="center" gap={1}>
                    <CloseIcon boxSize={2} aria-hidden />
                    {formatMessage({
                        defaultMessage: 'Canceled',
                        id: 'order_status_badge.label.cancelled'
                    })}
                </Flex>
            ) : returnDisplayStatus ? (
                formatMessage(RETURN_STATUS_BADGE_MESSAGES[returnDisplayStatus])
            ) : (
                order.status || order.omsData?.status
            )}
        </Badge>
    )
}

OrderStatusBadge.propTypes = {
    order: PropTypes.object.isRequired,
    cancelFeedback: PropTypes.shape({
        status: PropTypes.string
    }),
    returnFeedback: PropTypes.shape({
        status: PropTypes.string
    })
}

export default OrderStatusBadge
