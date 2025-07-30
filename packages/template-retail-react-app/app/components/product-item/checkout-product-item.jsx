/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {Box, Flex, Stack, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import CartItemVariantImage from '@salesforce/retail-react-app/app/components/item-variant/item-image'
import CartItemVariantName from '@salesforce/retail-react-app/app/components/item-variant/item-name'
import ItemAttributes from '@salesforce/retail-react-app/app/components/item-variant/item-attributes'
import CartItemVariantPrice from '@salesforce/retail-react-app/app/components/item-variant/item-price'
import BonusProductQuantity from '@salesforce/retail-react-app/app/components/product-item/bonus-product-quantity'

import {useCurrency, useDerivedProduct} from '@salesforce/retail-react-app/app/hooks'

const CheckoutProductItem = ({product}) => {
    const {quantity} = useDerivedProduct(product)
    const {currency: activeCurrency} = useCurrency()
    return (
        <Box
            position="relative"
            data-testid={`sf-checkout-item-${product.productId ? product.productId : product.id}`}
        >
            <ItemVariantProvider variant={product}>
                <Stack
                    border="1px solid"
                    borderColor="gray.200"
                    borderRadius="md"
                    p={3}
                    align="flex-start"
                >
                    <Flex width="full" alignItems="flex-start" backgroundColor="white">
                        <CartItemVariantImage width={['88px', '136px']} mr={4} />
                        <Stack spacing={3} flex={1}>
                            <Stack spacing={1}>
                                <CartItemVariantName />
                                <ItemAttributes excludeBonusLabel hideAttributeLabels={true} />
                            </Stack>

                            <Flex align="flex-end" justify="space-between">
                                <Stack spacing={1}>
                                    {product.bonusProductLineItem ? (
                                        <BonusProductQuantity product={product} />
                                    ) : (
                                        <Text fontSize="sm" color="gray.700">
                                            <FormattedMessage
                                                defaultMessage="Qty: {quantity}"
                                                values={{quantity: product.quantity}}
                                                id="checkout_product_item.label.quantity_static"
                                            />
                                        </Text>
                                    )}
                                </Stack>
                                <CartItemVariantPrice currency={activeCurrency} />
                            </Flex>
                        </Stack>
                    </Flex>
                </Stack>
            </ItemVariantProvider>
        </Box>
    )
}

CheckoutProductItem.propTypes = {
    product: PropTypes.object.isRequired
}

export default CheckoutProductItem
