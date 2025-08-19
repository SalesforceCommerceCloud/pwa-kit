/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {Box, Flex, Stack, VStack} from '@chakra-ui/react'
import ItemVariantProvider from '@salesforce/retail-react-app/app/components/item-variant'
import CartItemVariantImage from '@salesforce/retail-react-app/app/components/item-variant/item-image'
import CartItemVariantName from '@salesforce/retail-react-app/app/components/item-variant/item-name'
import CartItemVariantAttributes from '@salesforce/retail-react-app/app/components/item-variant/item-attributes'
import CartItemVariantPrice from '@salesforce/retail-react-app/app/components/item-variant/item-price'

/**
 * ProductList - Displays a list of product items
 *
 * @param {Object} props - Component props
 * @param {Array} props.variants - Array of product variants with merged product and order data (required)
 * @param {string} props.currency - Currency code for price display (e.g., 'USD', 'EUR')
 * @param {string|Array} props.imageWidth - Product image width
 *   - String: Fixed width (e.g., '22', '36')
 *   - Array: Responsive widths [mobile, desktop] (e.g., [22, 36])
 * @param {number|Array} props.padding - Internal padding inside each product item box
 *   - Number: Same padding for all breakpoints (e.g., 4 = 16px)
 *   - Array: Responsive padding [mobile, desktop] (e.g., [4, 6] = [16px, 24px])
 * @param {number|Array} props.spacing - Gap between product items
 *   - Number: Same spacing for all breakpoints (e.g., 2 = 8px, 4 = 16px)
 *   - Array: Responsive spacing [mobile, desktop] (e.g., [2, 4] = [8px, 16px])
 */
const ProductList = ({
    variants = [],
    currency,
    imageWidth = [22, 36],
    padding = [4, 6],
    spacing = 4
}) => {
    return (
        <VStack spacing={spacing} align="stretch">
            {variants?.map((variant, index) => (
                <Box
                    p={padding}
                    key={variant.itemId || variant.id || index}
                    border="1px solid"
                    borderColor="gray.100"
                    borderRadius="base"
                >
                    <ItemVariantProvider variant={variant} currency={currency}>
                        <Flex width="full" alignItems="flex-start">
                            <CartItemVariantImage width={imageWidth} mr={4} />
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
        </VStack>
    )
}

ProductList.propTypes = {
    variants: PropTypes.array.isRequired,
    currency: PropTypes.string,
    imageWidth: PropTypes.oneOfType([PropTypes.string, PropTypes.array]),
    padding: PropTypes.oneOfType([PropTypes.number, PropTypes.array]),
    spacing: PropTypes.oneOfType([PropTypes.number, PropTypes.array])
}

export default ProductList
