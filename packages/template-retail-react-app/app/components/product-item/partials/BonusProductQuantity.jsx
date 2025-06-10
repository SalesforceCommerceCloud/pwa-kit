/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {Text} from '@salesforce/retail-react-app/app/components/shared/ui'

const BonusProductQuantity = ({product}) => {
    const intl = useIntl()
    return (
        <Text
            fontSize="sm"
            color="gray.700"
            aria-label={intl.formatMessage(
                {
                    id: 'item_variant.assistive_msg.quantity',
                    defaultMessage: 'Quantity {quantity}'
                },
                {
                    quantity: product?.quantity
                }
            )}
        >
            <FormattedMessage
                defaultMessage="Quantity: {quantity}"
                id="bonusproduct_item.label.quantity"
                values={{
                    quantity: product.quantity
                }}
            />
        </Text>
    )
}

BonusProductQuantity.propTypes = {
    product: PropTypes.object.isRequired
}

export default BonusProductQuantity
