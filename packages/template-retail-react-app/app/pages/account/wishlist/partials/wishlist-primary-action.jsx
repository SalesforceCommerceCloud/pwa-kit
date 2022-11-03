/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {Button, useDisclosure} from '@chakra-ui/react'
import useBasket from '../../../../commerce-api/hooks/useBasket'
import {FormattedMessage, useIntl} from 'react-intl'
import {useItemVariant} from '../../../../components/item-variant'
import ProductViewModal from '../../../../components/product-view-modal'
import {useToast} from '../../../../hooks/use-toast'
import {API_ERROR_MESSAGE} from '../../../../constants'

/**
 * Renders primary action on a product-item card in the form of a button.
 * Represents the most prominent action you want the user to perform with the product-item
 * eg.: Add to cart option for wishlist items
 */
const WishlistPrimaryAction = () => {
    const variant = useItemVariant()
    const basket = useBasket()
    const {formatMessage} = useIntl()
    const isMasterProduct = variant?.type?.master || false
    const showToast = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const {isOpen, onOpen, onClose} = useDisclosure()
    const handleAddToCart = async (item, quantity) => {
        setIsLoading(true)
        const productItems = [
            {
                productId: item.id || item.productId,
                price: item.price,
                quantity
            }
        ]
        try {
            await basket.addItemToBasket(productItems)
            showToast({
                title: formatMessage(
                    {
                        defaultMessage:
                            '{quantity} {quantity, plural, one {item} other {items}} added to cart',
                        id: 'wishlist_primary_action.info.added_to_cart'
                    },
                    {quantity: quantity}
                ),
                status: 'success'
            })
            onClose()
        } catch (error) {
            showToast({
                title: formatMessage(API_ERROR_MESSAGE),
                status: 'error'
            })
        }
        setIsLoading(false)
    }

    return (
        <>
            {isMasterProduct ? (
                <>
                    <Button w={'full'} variant={'solid'} onClick={onOpen}>
                        <FormattedMessage
                            defaultMessage="Select Options"
                            id="wishlist_primary_action.button.select_options"
                        />
                    </Button>
                    {isOpen && (
                        <ProductViewModal
                            isOpen={isOpen}
                            onOpen={onOpen}
                            onClose={onClose}
                            product={variant}
                            addToCart={(variant, quantity) => handleAddToCart(variant, quantity)}
                        />
                    )}
                </>
            ) : (
                <Button
                    variant={'solid'}
                    onClick={() => handleAddToCart(variant, variant.quantity)}
                    w={'full'}
                    isLoading={isLoading}
                >
                    <FormattedMessage
                        defaultMessage="Add to Cart"
                        id="wishlist_primary_action.button.add_to_cart"
                    />
                </Button>
            )}
        </>
    )
}

export default WishlistPrimaryAction
