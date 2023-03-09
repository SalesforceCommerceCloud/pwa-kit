/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {Button, useDisclosure} from '@chakra-ui/react'
import {useShopperBasketsMutation} from 'commerce-sdk-react-preview'
import {FormattedMessage, useIntl} from 'react-intl'
import {useItemVariant} from '../../../../components/item-variant'
import ProductViewModal from '../../../../components/product-view-modal'
import {useToast} from '../../../../hooks/use-toast'
import {API_ERROR_MESSAGE} from '../../../../constants'
import {useCurrentBasket} from '../../../../hooks/use-current-basket'

/**
 * Renders primary action on a product-item card in the form of a button.
 * Represents the most prominent action you want the user to perform with the product-item
 * eg.: Add to cart option for wishlist items
 */
const WishlistPrimaryAction = () => {
    const variant = useItemVariant()
    const {basket} = useCurrentBasket()
    const {formatMessage} = useIntl()
    const isMasterProduct = variant?.type?.master || false
    const showToast = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const {isOpen, onOpen, onClose} = useDisclosure()

    const addItemToBasket = useShopperBasketsMutation('addItemToBasket')

    const handleAddToCart = async (item, quantity) => {
        setIsLoading(true)
        const productItems = [
            {
                productId: item.id || item.productId,
                price: item.price,
                quantity
            }
        ]

        addItemToBasket.mutate(
            {body: productItems, parameters: {basketId: basket.basketId}},
            {
                onSuccess: () => {
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
                },
                onError: () => {
                    showToast({
                        title: formatMessage(API_ERROR_MESSAGE),
                        status: 'error'
                    })
                },
                onSettled: () => {
                    setIsLoading(false)
                }
            }
        )
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
