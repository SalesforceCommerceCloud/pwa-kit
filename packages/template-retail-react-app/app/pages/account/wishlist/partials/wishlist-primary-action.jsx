/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {Button, useDisclosure} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {FormattedMessage, useIntl} from 'react-intl'
import {useItemVariant} from '@salesforce/retail-react-app/app/components/item-variant'
import ProductViewModal from '@salesforce/retail-react-app/app/components/product-view-modal'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import Link from '@salesforce/retail-react-app/app/components/link'

/**
 * Renders primary action on a product-item card in the form of a button.
 * Represents the most prominent action you want the user to perform with the product-item
 * eg.: Add to cart option for wishlist items
 */
const WishlistPrimaryAction = () => {
    const variant = useItemVariant()
    const {data: basket} = useCurrentBasket()
    const {formatMessage} = useIntl()
    const isMasterProduct = variant?.type?.master || false
    const isProductASet = variant?.type?.set
    const showToast = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const {isOpen, onOpen, onClose} = useDisclosure()

    const addItemToBasket = useShopperBasketsMutation('addItemToBasket')

    const handleAddToCart = async (item, quantity) => {
        setIsLoading(true)

        const isAddingASet = Boolean(item.setProducts)
        const productItems = isAddingASet
            ? item.setProducts.map((child) => ({
                  productId: child.id || child.productId,
                  price: child.price,
                  quantity
              }))
            : [
                  {
                      productId: item.id || item.productId,
                      price: item.price,
                      quantity
                  }
              ]

        addItemToBasket.mutate(
            {body: productItems, parameters: {basketId: basket?.basketId}},
            {
                onSuccess: () => {
                    showToast({
                        title: formatMessage(
                            {
                                defaultMessage:
                                    '{quantity} {quantity, plural, one {item} other {items}} added to cart',
                                id: 'wishlist_primary_action.info.added_to_cart'
                            },
                            {quantity: isAddingASet ? quantity * item.setProducts.length : quantity}
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

    const buttonText = {
        viewOptions: (
            <FormattedMessage
                defaultMessage="View Options"
                id="wishlist_primary_action.button.view_options"
            />
        ),
        viewFullDetails: (
            <FormattedMessage
                defaultMessage="View Full Details"
                id="wishlist_primary_action.button.view_full_details"
            />
        ),
        addToCart: (
            <FormattedMessage
                defaultMessage="Add to Cart"
                id="wishlist_primary_action.button.add_to_cart"
            />
        ),
        addSetToCart: (
            <FormattedMessage
                defaultMessage="Add Set to Cart"
                id="wishlist_primary_action.button.add_set_to_cart"
            />
        )
    }

    if (isProductASet) {
        if (variant.setProducts?.every((child) => !hasVariants(child))) {
            return (
                <Button
                    variant={'solid'}
                    onClick={() => handleAddToCart(variant, variant.quantity)}
                    w={'full'}
                    isLoading={isLoading}
                >
                    {buttonText.addSetToCart}
                </Button>
            )
        } else {
            return (
                <Button
                    as={Link}
                    href={`/product/${variant.id}`}
                    w={'full'}
                    variant={'solid'}
                    _hover={{textDecoration: 'none'}}
                >
                    {buttonText.viewFullDetails}
                </Button>
            )
        }
    } else {
        if (isMasterProduct) {
            return (
                <>
                    <Button w={'full'} variant={'solid'} onClick={onOpen}>
                        {buttonText.viewOptions}
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
            )
        } else {
            return (
                <Button
                    variant={'solid'}
                    onClick={() => handleAddToCart(variant, variant.quantity)}
                    w={'full'}
                    isLoading={isLoading}
                >
                    {buttonText.addToCart}
                </Button>
            )
        }
    }
}

export default WishlistPrimaryAction

const hasVariants = (product) => Boolean(product?.variants)
