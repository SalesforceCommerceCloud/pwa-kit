/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {
    Box,
    Flex,
    Stack,
    Text,
    NumberInput,
    NumberInputField,
    NumberInputStepper,
    NumberIncrementStepper,
    NumberDecrementStepper,
    useNumberInput,
    HStack,
    Button,
    Input
} from '@chakra-ui/react'
import CartItemVariant from '../cart-item-variant'
import CartItemVariantImage from '../cart-item-variant/item-image'
import CartItemVariantName from '../cart-item-variant/item-name'
import CartItemVariantAttributes from '../cart-item-variant/item-attributes'
import CartItemVariantPrice from '../cart-item-variant/item-price'
import LoadingSpinner from '../loading-spinner'
import {noop} from '../../utils/utils'

import {HideOnDesktop, HideOnMobile} from '../responsive'
import {MAX_ORDER_QUANTITY} from '../../constants'

import {useProduct} from '../../hooks'

/**
 * Component representing a product item usually in a list with details about the product - name, variant, pricing, etc.
 * @param {Object} product Product to be represented in the list item.
 * @param {node} primaryAction Child component representing the most prominent action to be performed by the user.
 * @param {node} secondaryActions Child component representing the other actions relevant to the product to be performed by the user.
 * @param {func} onItemQuantityChange callback function to be invoked whenever item quantity changes.
 * @param {boolean} showLoading Renders a loading spinner with overlay if set to true.
 * @returns A JSX element representing product item in a list (eg: wishlist, cart, etc).
 */
const ProductItem = ({
    product,
    primaryAction,
    secondaryActions,
    onItemQuantityChange = noop,
    showLoading = false
}) => {
    const {stepQuantity, stockLevel} = useProduct(product)
    // Mobile Quantity Stepper Logic
    const {getInputProps, getIncrementButtonProps, getDecrementButtonProps} = useNumberInput({
        keepWithinRange: false,
        clampValueOnBlur: false,
        step: 1,
        min: 1,
        max: MAX_ORDER_QUANTITY,
        // onChange: (valueString) => onItemQuantityChange(valueString),
        onBlur: (event) => {
            console.log(event.target.value)
        },
        defaultValue: product.quantity
    })

    const inc = getIncrementButtonProps()
    const dec = getDecrementButtonProps()
    const input = getInputProps()
    // Mobile Quantity Stepper Logic

    return (
        <Box position="relative" data-testid={`sf-cart-item-${product.productId}`}>
            <CartItemVariant variant={product}>
                {showLoading && <LoadingSpinner />}
                <Stack layerStyle="cardBordered" align="flex-start">
                    <Flex width="full" alignItems="flex-start" backgroundColor="white">
                        <CartItemVariantImage width={['88px', '136px']} mr={4} />

                        <Stack spacing={3} flex={1}>
                            <Stack spacing={1}>
                                <CartItemVariantName />
                                <CartItemVariantAttributes />
                                <HideOnDesktop>
                                    <Text fontSize="sm" color="gray.700">
                                        <FormattedMessage defaultMessage="Price:" />
                                    </Text>
                                    <CartItemVariantPrice align="left" />
                                </HideOnDesktop>
                            </Stack>

                            <Flex align="flex-end" justify="space-between">
                                <Stack spacing={1}>
                                    <Text fontSize="sm" color="gray.700">
                                        <FormattedMessage defaultMessage="Quantity:" />
                                    </Text>
                                    {/* 
                                    <HideOnMobile>
                                        <NumberInput
                                            width="100px"
                                            onChange={(valueString) =>
                                                onItemQuantityChange(valueString)
                                            }
                                            value={product.quantity}
                                            min={1}
                                            max={10}
                                        >
                                            <NumberInputField />
                                            <NumberInputStepper>
                                                <NumberIncrementStepper />
                                                <NumberDecrementStepper />
                                            </NumberInputStepper>
                                        </NumberInput>
                                    </HideOnMobile>
                                    <HideOnDesktop> */}
                                    <HStack maxW="80%">
                                        <Button {...dec}>-</Button>
                                        <Input {...input} />
                                        <Button {...inc}>+</Button>
                                    </HStack>
                                    {/* </HideOnDesktop> */}
                                </Stack>
                                <Stack>
                                    <HideOnMobile>
                                        <CartItemVariantPrice />
                                    </HideOnMobile>
                                    <Box display={['none', 'block', 'block', 'block']}>
                                        {primaryAction}
                                    </Box>
                                </Stack>
                            </Flex>

                            {secondaryActions}
                        </Stack>
                    </Flex>
                    {!showLoading && (
                        <Box display={['block', 'none', 'none', 'none']} w={'full'}>
                            {primaryAction}
                        </Box>
                    )}
                </Stack>
            </CartItemVariant>
        </Box>
    )
}

ProductItem.propTypes = {
    product: PropTypes.object,
    onItemQuantityChange: PropTypes.func,
    onAddItemToCart: PropTypes.func,
    showLoading: PropTypes.bool,
    isWishlistItem: PropTypes.bool,
    primaryAction: PropTypes.node,
    secondaryActions: PropTypes.node
}

export default ProductItem
