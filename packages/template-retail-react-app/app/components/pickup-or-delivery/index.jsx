/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'

// Chakra Components
import {Box, Select} from '@salesforce/retail-react-app/app/components/shared/ui'

// Constants
const DELIVERY_OPTIONS = {
    DELIVERY: 'delivery',
    PICKUP: 'pickup'
}

/**
 * PickupOrDelivery combo component that allows users to choose between shipping and pickup options
 * @param {string} value - Current selected delivery option
 * @param {function} onChange - Callback function when delivery option changes
 * @param {boolean} isPickupDisabled - Whether pickup option is disabled
 * @param {boolean} isShipDisabled - Whether shipping option is disabled
 * @returns A JSX element representing the pickup or delivery selection
 */
const PickupOrDelivery = ({
    value = DELIVERY_OPTIONS.DELIVERY,
    onChange,
    isPickupDisabled = false,
    isShipDisabled = false
}) => {
    const intl = useIntl()

    const handleDeliveryOptionChange = (selectedValue) => {
        if (onChange) {
            onChange(selectedValue)
        }
    }

    return (
        <Box>
            <Select
                value={value}
                onChange={(e) => handleDeliveryOptionChange(e.target.value)}
                size="sm"
                data-testid="delivery-option-select"
                aria-label={intl.formatMessage({
                    defaultMessage: 'Choose delivery option',
                    id: 'pickup_or_delivery.label.choose_delivery_option'
                })}
            >
                <option value={DELIVERY_OPTIONS.DELIVERY} disabled={isShipDisabled}>
                    {intl.formatMessage({
                        defaultMessage: 'Ship to Address',
                        id: 'pickup_or_delivery.label.ship_to_address'
                    })}
                </option>
                <option value={DELIVERY_OPTIONS.PICKUP} disabled={isPickupDisabled}>
                    {intl.formatMessage({
                        defaultMessage: 'Pick Up in Store',
                        id: 'pickup_or_delivery.label.pickup_in_store'
                    })}
                </option>
            </Select>
        </Box>
    )
}

PickupOrDelivery.propTypes = {
    value: PropTypes.oneOf([DELIVERY_OPTIONS.DELIVERY, DELIVERY_OPTIONS.PICKUP]),
    onChange: PropTypes.func,
    isPickupDisabled: PropTypes.bool,
    isShipDisabled: PropTypes.bool
}

export default PickupOrDelivery
export {DELIVERY_OPTIONS}
