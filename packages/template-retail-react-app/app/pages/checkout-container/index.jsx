/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {useIntl} from 'react-intl'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {CheckoutProvider} from '@salesforce/retail-react-app/app/pages/checkout-container/util/checkout-context'
import CheckoutSkeleton from '@salesforce/retail-react-app/app/pages/checkout-container/partials/checkout-skeleton'
import Checkout from '@salesforce/retail-react-app/app/pages/checkout/index'
import CheckoutOneClick from '@salesforce/retail-react-app/app/pages/checkout-one-click/index'
import UnavailableProductConfirmationModal from '@salesforce/retail-react-app/app/components/unavailable-product-confirmation-modal'
import LoadingSpinner from '@salesforce/retail-react-app/app/components/loading-spinner'
import {
    TOAST_MESSAGE_REMOVED_ITEM_FROM_CART,
    API_ERROR_MESSAGE
} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const CheckoutContainer = () => {
    const {oneClickCheckout = {}} = getConfig().app || {}
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()
    const {formatMessage} = useIntl()
    const removeItemFromBasketMutation = useShopperBasketsMutation('removeItemFromBasket')
    const toast = useToast()
    const [isDeletingUnavailableItem, setIsDeletingUnavailableItem] = useState(false)

    const handleRemoveItem = async (product) => {
        await removeItemFromBasketMutation.mutateAsync(
            {
                parameters: {basketId: basket.basketId, itemId: product.itemId}
            },
            {
                onSuccess: () => {
                    toast({
                        title: formatMessage(TOAST_MESSAGE_REMOVED_ITEM_FROM_CART, {quantity: 1}),
                        status: 'success'
                    })
                },
                onError: () => {
                    toast({
                        title: formatMessage(API_ERROR_MESSAGE),
                        status: 'error'
                    })
                }
            }
        )
    }
    const handleUnavailableProducts = async (unavailableProductIds) => {
        setIsDeletingUnavailableItem(true)
        const productItems = basket?.productItems?.filter((item) =>
            unavailableProductIds?.includes(item.productId)
        )
        for (let item of productItems) {
            await handleRemoveItem(item)
        }
        setIsDeletingUnavailableItem(false)
    }

    if (!customer || !customer.customerId || !basket || !basket.basketId) {
        return <CheckoutSkeleton />
    }

    return (
        <CheckoutProvider>
            {isDeletingUnavailableItem && <LoadingSpinner wrapperStyles={{height: '100vh'}} />}

            {oneClickCheckout.enabled ? <CheckoutOneClick /> : <Checkout />}
            <UnavailableProductConfirmationModal
                productItems={basket?.productItems}
                handleUnavailableProducts={handleUnavailableProducts}
            />
        </CheckoutProvider>
    )
}

export default CheckoutContainer
