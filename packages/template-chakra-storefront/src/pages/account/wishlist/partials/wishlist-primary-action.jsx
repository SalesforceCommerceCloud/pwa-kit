/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {Button, useDisclosure} from '@chakra-ui/react'
import {useIntl} from 'react-intl'
import {useItemVariant} from '../../../../components/item-variant'
import ProductViewModal from '../../../../components/product-view-modal'
import useToast from '../../../../hooks/use-toast'
import {API_ERROR_MESSAGE} from '../../../../../config/constants'
import Link from '../../../../components/link'
import {useShopperBasketsMutationHelper} from '@salesforce/commerce-sdk-react'

/**
 * Renders primary action on a product-item card in the form of a button.
 * Represents the most prominent action you want the user to perform with the product-item
 * eg.: Add to cart option for wishlist items
 */
const WishlistPrimaryAction = () => {
    const variant = useItemVariant()
    const {addItemToNewOrExistingBasket} = useShopperBasketsMutationHelper()
    const {formatMessage} = useIntl()
    const isMasterProduct = variant?.type?.master || false
    const isProductASet = variant?.type?.set
    const isProductABundle = variant?.type?.bundle
    const toast = useToast()
    const [isLoading, setIsLoading] = useState(false)
    const {open, onOpen, onClose} = useDisclosure()

    const messages = {
        addedToCart: (quantity, isAddingASet, item) => formatMessage(
            {
                defaultMessage: '{quantity} {quantity, plural, one {item} other {items}} added to cart',
                id: 'wishlist_primary_action.info.added_to_cart'
            },
            {quantity: isAddingASet ? quantity * item.setProducts.length : quantity}
        ),
        viewOptions: formatMessage({
            defaultMessage: 'View Options',
            id: 'wishlist_primary_action.button.view_options'
        }),
        viewFullDetails: formatMessage({
            defaultMessage: 'View Full Details',
            id: 'wishlist_primary_action.button.view_full_details'
        }),
        addToCart: formatMessage({
            defaultMessage: 'Add to Cart',
            id: 'wishlist_primary_action.button.add_to_cart'
        }),
        addSetToCart: formatMessage({
            defaultMessage: 'Add Set to Cart',
            id: 'wishlist_primary_action.button.add_set_to_cart'
        }),
        addSetToCartLabel: (productName) => formatMessage(
            {
                id: 'wishlist_primary_action.button.addSetToCart.label',
                defaultMessage: 'Add {productName} set to cart'
            },
            {productName}
        ),
        viewFullDetailsLabel: (productName) => formatMessage(
            {
                id: 'wishlist_primary_action.button.viewFullDetails.label',
                defaultMessage: 'View full details for {productName}'
            },
            {productName}
        ),
        viewOptionsLabel: (productName) => formatMessage(
            {
                id: 'wishlist_primary_action.button.view_options.label',
                defaultMessage: 'View Options for {productName}'
            },
            {productName}
        ),
        addToCartLabel: (productName) => formatMessage(
            {
                id: 'wishlist_primary_action.button.addToCart.label',
                defaultMessage: 'Add {productName} to cart'
            },
            {productName}
        )
    }

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

        try {
            await addItemToNewOrExistingBasket(productItems)
            toast({
                title: messages.addedToCart(quantity, isAddingASet, item),
                type: 'success'
            })
            onClose()
        } catch (e) {
            toast({
                title: formatMessage(API_ERROR_MESSAGE),
                type: 'error'
            })
        } finally {
            setIsLoading(false)
        }
    }


    if (isProductASet) {
        if (variant.setProducts?.every((child) => !hasVariants(child))) {
            return (
                <Button
                    variant="solid"
                    onClick={() => handleAddToCart(variant, variant.quantity)}
                    size="md"
                    loading={isLoading}
                    aria-label={messages.addSetToCartLabel(variant.name)}
                >
                    {messages.addSetToCart}
                </Button>
            )
        } else {
            return (
                <Button
                    asChild
                    size="md"
                    variant="solid"
                    _hover={{textDecoration: 'none'}}
                    aria-label={messages.viewFullDetailsLabel(variant.name)}
                >
                    <Link href={`/product/${variant.id}`}>{messages.viewFullDetails}</Link>
                </Button>
            )
        }
    } else if (isProductABundle) {
        return (
            <Button
                asChild
                size="md"
                variant="solid"
                _hover={{textDecoration: 'none'}}
                aria-label={messages.viewFullDetailsLabel(variant.name)}
            >
                <Link href={`/product/${variant.id}`}>{messages.viewFullDetails}</Link>
            </Button>
        )
    } else {
        if (isMasterProduct) {
            return (
                <>
                    <Button
                        aria-label={messages.viewOptionsLabel(variant.name)}
                        size="md"
                        variant="solid"
                        onClick={() => {
                            onOpen()
                        }}
                    >
                        {messages.viewOptions}
                    </Button>
                    {open && (
                        <ProductViewModal
                            isOpen={open}
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
                    variant="solid"
                    onClick={() => handleAddToCart(variant, variant.quantity)}
                    size="md"
                    loading={isLoading}
                    aria-label={messages.addToCartLabel(variant.name)}
                >
                    {messages.addToCart}
                </Button>
            )
        }
    }
}

export default WishlistPrimaryAction

const hasVariants = (product) => Boolean(product?.variants)
