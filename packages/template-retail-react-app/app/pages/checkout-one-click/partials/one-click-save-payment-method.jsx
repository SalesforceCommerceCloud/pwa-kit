/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import PropTypes from 'prop-types'
import {Checkbox, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {FormattedMessage} from 'react-intl'

export default function SavePaymentMethod({onSaved, checked}) {
    const [shouldSave, setShouldSave] = useState(false)
    const {data: customer} = useCurrentCustomer()

    // Sync from parent when provided so we can preselect visually
    React.useEffect(() => {
        if (typeof checked === 'boolean') {
            setShouldSave(checked)
        }
    }, [checked])

    // Just track the user's preference, don't call API yet
    const handleCheckboxChange = (e) => {
        const newValue = e.target.checked
        setShouldSave(newValue)
        onSaved?.(newValue) // Pass the boolean preference to parent
    }

    // Don't render if no customer
    if (!customer?.customerId) {
        return null
    }

    return (
        <Checkbox isChecked={shouldSave} onChange={handleCheckboxChange} size="md">
            <Text fontSize="sm" color="gray.700">
                <FormattedMessage
                    defaultMessage="Save this payment method for future use"
                    id="checkout.payment.save_payment_method"
                />
            </Text>
        </Checkbox>
    )
}

SavePaymentMethod.propTypes = {
    /** Callback when checkbox state changes - receives boolean value */
    onSaved: PropTypes.func,
    /** Controlled checked prop to preselect visually */
    checked: PropTypes.bool
}
