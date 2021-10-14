/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {Button} from '@chakra-ui/react'
import useBasket from '../../../../commerce-api/hooks/useBasket'
import {useIntl} from 'react-intl'
import {useItemVariant} from '../../../../components/item-variant'
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

    const handleAddToCart = async () => {
        setIsLoading(true)
        const productItem = [
            {
                productId: variant.productId,
                quantity: variant.quantity,
                price: variant.price
            }
        ]
        try {
            await basket.addItemToBasket(productItem)
            showToast({
                title: formatMessage(
                    {
                        defaultMessage:
                            '{quantity} {quantity, plural, one {item} other {items}} added to cart'
                    },
                    {quantity: variant.quantity}
                ),
                status: 'success'
            })
        } catch (error) {
            showToast({
                title: formatMessage(
                    {defaultMessage: '{errorMessage}'},
                    {errorMessage: API_ERROR_MESSAGE}
                ),
                status: 'error'
            })
        }
        setIsLoading(false)
    }

    return (
        <>
            {isMasterProduct ? (
                <Button w={'full'} variant={'solid'}>
                    Select Options
                </Button>
            ) : (
                <Button
                    variant={'solid'}
                    onClick={handleAddToCart}
                    w={'full'}
                    isLoading={isLoading}
                >
                    Add To Cart
                </Button>
            )}
        </>
    )
}

export default WishlistPrimaryAction
