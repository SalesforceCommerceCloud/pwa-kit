/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {Text, VisuallyHidden} from '@salesforce/retail-react-app/app/components/shared/ui'
import QuantityPicker from '@salesforce/retail-react-app/app/components/quantity-picker'

const ProductQuantityPicker = ({
    product,
    onItemQuantityChange,
    stepQuantity,
    quantity,
    setQuantity
}) => {
    const intl = useIntl()

    const handleQuantityChange = (stringValue, numberValue) => {
        // Set the Quantity of product to value of input if value number
        if (numberValue >= 0) {
            // Call handler
            onItemQuantityChange(numberValue).then(
                (isValidChange) => isValidChange && setQuantity(numberValue)
            )
        } else if (stringValue === '') {
            // We want to allow the use to clear the input to start a new input so here we set the quantity to '' so NAN is not displayed
            // User will not be able to add '' quantity to the cart due to the add to cart button enablement rules
            setQuantity(stringValue)
        }
    }

    const handleQuantityBlur = (e) => {
        // Default to last known quantity if a user leaves the box with an invalid value
        const {value} = e.target

        if (!value) {
            setQuantity(product.quantity)
        }
    }

    return (
        <>
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
                <FormattedMessage defaultMessage="Quantity:" id="product_item.label.quantity" />
            </Text>
            <QuantityPicker
                step={stepQuantity}
                value={quantity}
                min={0}
                clampValueOnBlur={false}
                onBlur={handleQuantityBlur}
                onChange={handleQuantityChange}
                productName={product?.name}
            />
            <VisuallyHidden role="status">
                {product?.name}
                {intl.formatMessage(
                    {
                        id: 'item_variant.assistive_msg.quantity',
                        defaultMessage: 'Quantity {quantity}'
                    },
                    {
                        quantity: product?.quantity
                    }
                )}
            </VisuallyHidden>
        </>
    )
}

ProductQuantityPicker.propTypes = {
    product: PropTypes.object.isRequired,
    onItemQuantityChange: PropTypes.func.isRequired,
    stepQuantity: PropTypes.number.isRequired,
    quantity: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
    setQuantity: PropTypes.func.isRequired
}

export default ProductQuantityPicker
