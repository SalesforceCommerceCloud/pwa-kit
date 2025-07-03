/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {Text, Skeleton} from '@salesforce/retail-react-app/app/components/shared/ui'

const BonusProductQuantity = ({product}) => {
    const intl = useIntl()
    return (
        <Skeleton isLoaded={product}>
            <Text
                fontSize="sm"
                color="gray.700"
                aria-label={intl.formatMessage(
                    {
                        id: 'item_variant.quantity.label',
                        defaultMessage:
                            'Quantity selector for {productName}. Selected quantity is {quantity}'
                    },
                    {
                        quantity: product?.quantity,
                        productName: product?.name
                    }
                )}
            >
                <FormattedMessage
                    defaultMessage="Quantity: {quantity}"
                    id="bonus_product_item.label.quantity"
                    values={{quantity: product?.quantity}}
                />
            </Text>
        </Skeleton>
    )
}

BonusProductQuantity.propTypes = {
    product: PropTypes.object
}

export default BonusProductQuantity
