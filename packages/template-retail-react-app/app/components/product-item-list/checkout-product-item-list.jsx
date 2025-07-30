/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import CheckoutProductItem from '@salesforce/retail-react-app/app/components/product-item/checkout-product-item'

const CheckoutProductItemList = ({productItems, productsByItemId, isProductsLoading}) => {
    return (
        <Stack spacing={4}>
            {productItems.map((productItem) => (
                <CheckoutProductItem
                    key={productItem.itemId}
                    product={{
                        ...productItem,
                        ...(productsByItemId && productsByItemId[productItem.itemId]),
                        isProductUnavailable: !isProductsLoading
                            ? !productsByItemId?.[productItem.itemId]
                            : undefined
                    }}
                />
            ))}
        </Stack>
    )
}

CheckoutProductItemList.propTypes = {
    productItems: PropTypes.array.isRequired,
    productsByItemId: PropTypes.object,
    isProductsLoading: PropTypes.bool
}

export default CheckoutProductItemList
