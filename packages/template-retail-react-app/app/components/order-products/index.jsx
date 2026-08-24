/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Box, Flex, Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useProducts} from '@salesforce/commerce-sdk-react'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import CartItemVariantImage from '@salesforce/retail-react-app/app/components/item-variant/item-image'
import CartItemVariantName from '@salesforce/retail-react-app/app/components/item-variant/item-name'
import CartItemVariantAttributes from '@salesforce/retail-react-app/app/components/item-variant/item-attributes'
import CartItemVariantPrice from '@salesforce/retail-react-app/app/components/item-variant/item-price'
import {consolidateDuplicateBonusProducts} from '@salesforce/retail-react-app/app/utils/bonus-product/cart'

const onClient = typeof window !== 'undefined'

export const groupProductItemsByShipmentId = (productItems) =>
    (productItems || []).reduce((itemsByShipmentId, item) => {
        const shipmentId = item.shipmentId ?? 'default'
        if (!itemsByShipmentId[shipmentId]) itemsByShipmentId[shipmentId] = []
        itemsByShipmentId[shipmentId].push(item)
        return itemsByShipmentId
    }, {})

const OrderProducts = ({productItems, currency}) => {
    const orderProductIds = (productItems || []).map((product) => product.productId)
    const {data: products, isLoading} = useProducts(
        {parameters: {ids: orderProductIds}},
        {
            enabled: !!orderProductIds && onClient,
            select: (result) =>
                result?.data?.reduce((acc, item) => {
                    acc[item.id] = item
                    return acc
                }, {})
        }
    )
    const consolidatedItems = consolidateDuplicateBonusProducts(productItems || [])
    const variants = consolidatedItems?.map((item) => {
        const product = products?.[item.productId]
        return {
            ...(product ? product : {}),
            isProductUnavailable: !product,
            ...item
        }
    })

    return (
        <>
            {!isLoading &&
                variants?.map((variant, index) => (
                    <Box
                        key={index}
                        p={[4, 6]}
                        border="1px solid"
                        borderColor="gray.100"
                        borderRadius="base"
                    >
                        <ItemVariantProvider variant={variant} currency={currency}>
                            <Flex width="full" alignItems="flex-start">
                                <CartItemVariantImage width={['88px', 36]} mr={4} />
                                <Stack spacing={1} marginTop="-3px" flex={1}>
                                    <CartItemVariantName />
                                    <Flex
                                        width="full"
                                        justifyContent="space-between"
                                        alignItems="flex-end"
                                    >
                                        <CartItemVariantAttributes
                                            includeQuantity
                                            currency={currency}
                                        />
                                        <CartItemVariantPrice currency={currency} />
                                    </Flex>
                                </Stack>
                            </Flex>
                        </ItemVariantProvider>
                    </Box>
                ))}
        </>
    )
}

OrderProducts.propTypes = {
    productItems: PropTypes.array.isRequired,
    currency: PropTypes.string
}

export default OrderProducts
