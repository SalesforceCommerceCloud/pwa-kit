/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl, FormattedMessage, FormattedNumber} from 'react-intl'
import {Flex, Stack, Text, Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useItemVariant} from '@salesforce/retail-react-app/app/components/item-variant'
import PromoPopover from '@salesforce/retail-react-app/app/components/promo-popover'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {usePromotions, useProducts, useProduct} from '@salesforce/commerce-sdk-react'
import {getDisplayVariationValues} from '@salesforce/retail-react-app/app/utils/product-utils'

/**
 * In the context of a cart product item variant, this component renders a styled
 * list of the selected variation values as well as any promos (w/ info popover).
 */
const ItemAttributes = ({includeQuantity, currency, ...props}) => {
    const variant = useItemVariant()
    const {data: basket} = useCurrentBasket()
    const {currency: activeCurrency} = useCurrency()
    const promotionIds = variant.priceAdjustments?.map((adj) => adj.promotionId) ?? []
    const intl = useIntl()

    // Fetch all the promotions given by price adjustments. We display this info in
    // the promotion info popover when applicable.
    const {data: res} = usePromotions(
        {
            parameters: {
                ids: promotionIds.join(',')
            }
        },
        {
            enabled: promotionIds.length > 0
        }
    )
    const promos = res?.data || []
    const variationValues = getDisplayVariationValues(
        variant?.variationAttributes,
        variant?.variationValues
    )

    // get variant info for bundled products in cart page and order history page
    const productBundleIds =
        variant?.bundledProductItems?.map(({productId}) => productId).join(',') ?? ''
    const {data: productBundleVariantData, isLoading: bundleVariantIsLoading} = useProducts(
        {
            parameters: {
                ids: productBundleIds,
                allImages: false
            }
        },
        {
            enabled: Boolean(variant?.type?.bundle && productBundleIds),
            select: (result) => {
                // formats response so we can easily display child quantity/variant selection
                return result?.data?.map((item) => {
                    const quantity = variant?.bundledProductItems.find(
                        (childProduct) => childProduct.productId === item.id
                    )?.quantity
                    return {
                        ...item,
                        quantity,
                        variationValues: getDisplayVariationValues(
                            item?.variationAttributes,
                            item?.variationValues
                        )
                    }
                })
            }
        }
    )

    // get bundle product data for wishlist page
    const {data: productBundleData, isLoading: productBundleIsLoading} = useProduct(
        {
            parameters: {
                id: variant?.id,
                allImages: false
            }
        },
        {
            enabled: Boolean(variant?.type?.bundle && !productBundleIds)
        }
    )

    return (
        <Stack spacing={1.5} flex={1} {...props}>
            {variationValues &&
                Object.keys(variationValues).map((key) => (
                    <Text
                        lineHeight={1}
                        color="gray.700"
                        fontSize="sm"
                        key={`${key}: ${variationValues[key]}`}
                    >
                        {key}: {variationValues[key]}
                    </Text>
                ))}

            {includeQuantity && (
                <Text lineHeight={1} color="gray.700" fontSize="sm">
                    <FormattedMessage
                        defaultMessage="Quantity: {quantity}"
                        values={{quantity: variant.quantity}}
                        id="item_attributes.label.quantity"
                    />
                </Text>
            )}

            {!productBundleIsLoading && productBundleData && !productBundleVariantData && (
                <Box>
                    {productBundleData?.bundledProducts.map(({product, quantity}) => (
                        <Box marginTop={2} key={product.id}>
                            <Text fontSize="sm" color="gray.700" as="b">
                                {product?.name}
                            </Text>
                            <Text fontSize="sm" color="gray.700">
                                {intl.formatMessage({
                                    defaultMessage: 'Qty',
                                    id: 'add_to_cart_modal.label.quantity'
                                })}
                                : {quantity}
                            </Text>
                        </Box>
                    ))}
                </Box>
            )}

            {!bundleVariantIsLoading && productBundleVariantData && (
                <Box>
                    <Text fontSize={15} marginTop={3} fontWeight={500}>
                        {intl.formatMessage({
                            defaultMessage: 'Selected Options',
                            id: 'item_attributes.label.selected_options'
                        })}
                        :
                    </Text>
                    {productBundleVariantData?.map(
                        ({variationValues, name: productName, quantity, id}) => {
                            return (
                                <Box key={id} marginTop={2}>
                                    <Text fontSize="sm" color="gray.700" as="b">
                                        {productName}
                                    </Text>
                                    <Text fontSize="sm" color="gray.700">
                                        {intl.formatMessage({
                                            defaultMessage: 'Qty',
                                            id: 'add_to_cart_modal.label.quantity'
                                        })}
                                        : {quantity}
                                    </Text>
                                    {Object.keys(variationValues).map((key) => {
                                        const selectedVariant = `${key}: ${variationValues[key]}`
                                        return (
                                            <Text
                                                fontSize="sm"
                                                color="gray.700"
                                                key={selectedVariant}
                                            >
                                                {selectedVariant}
                                            </Text>
                                        )
                                    })}
                                </Box>
                            )
                        }
                    )}
                </Box>
            )}

            {variant.priceAdjustments?.length > 0 && (
                <Flex alignItems="center">
                    <Text lineHeight={1} color="gray.700" fontSize="sm">
                        <FormattedMessage
                            defaultMessage="Promotions"
                            id="item_attributes.label.promotions"
                        />
                        {': '}
                        <Text as="span" color="green.700">
                            <FormattedNumber
                                style="currency"
                                currency={currency || basket?.currency || activeCurrency}
                                value={variant.priceAdjustments.reduce(
                                    (acc, adj) => acc + (adj.price ?? 0),
                                    0
                                )}
                            />
                        </Text>
                    </Text>
                    <PromoPopover ml={2}>
                        <Stack>
                            {promos?.map((promo) => (
                                <Text key={promo?.id} fontSize="sm">
                                    {promo?.calloutMsg}
                                </Text>
                            ))}
                        </Stack>
                    </PromoPopover>
                </Flex>
            )}
        </Stack>
    )
}

ItemAttributes.propTypes = {
    includeQuantity: PropTypes.bool,
    currency: PropTypes.string
}

export default ItemAttributes
