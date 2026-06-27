/*
 * Copyright (c) 2026, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useMemo} from 'react'
import {useIntl} from 'react-intl'
import {Badge, Flex} from '@salesforce/retail-react-app/app/components/shared/ui'
import {CloseIcon} from '@salesforce/retail-react-app/app/components/icons'
import {
    getOrderDisplayStatus,
    ORDER_DISPLAY_STATUS
} from '@salesforce/retail-react-app/app/utils/order-status-utils'
import PropTypes from 'prop-types'

/**
 * Displays an order-level status badge. Derives the cancelled state from
 * item-level omsData.status via getOrderDisplayStatus (OMS-only); pure ECOM
 * orders fall through to the raw order.status string in a green badge.
 */
const OrderStatusBadge = ({order, cancelFeedback}) => {
    const {formatMessage} = useIntl()

    const isCancelled = useMemo(
        () =>
            cancelFeedback?.status === 'success' ||
            getOrderDisplayStatus(order) === ORDER_DISPLAY_STATUS.CANCELLED,
        [cancelFeedback?.status, order]
    )

    return (
        <Badge colorScheme={isCancelled ? 'red' : 'green'}>
            {isCancelled ? (
                <Flex display="inline-flex" alignItems="center" gap={1}>
                    <CloseIcon boxSize={2} aria-hidden />
                    {formatMessage({
                        defaultMessage: 'Cancelled',
                        id: 'order_status_badge.label.cancelled'
                    })}
                </Flex>
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
    })
}

export default OrderStatusBadge
