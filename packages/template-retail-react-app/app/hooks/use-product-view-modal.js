/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState} from 'react'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useIntl} from 'react-intl'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'
import {useProduct} from '@salesforce/commerce-sdk-react'
import {useVariant} from '@salesforce/retail-react-app/app/hooks/use-variant'

/**
 * This hook is responsible for fetching a product detail based on the current product/variant.
 * Note: This hook does NOT manage URL params. It expects the modal to manage variation selection
 * via React state passed through controlledVariationValues in the hooks chain.
 *
 * @param initialProduct - the initial product when the modal is first open
 * @param controlledVariationValues - optional controlled variation values from modal state
 * @param queryOptions - optional React Query options to pass to useProduct
 * @returns object containing product data and loading state
 */
export const useProductViewModal = (
    initialProduct,
    controlledVariationValues = null,
    queryOptions = {}
) => {
    const intl = useIntl()
    const toast = useToast()
    const [product, setProduct] = useState(initialProduct)

    // Compute the variant based on controlled variation values
    // Note: If product is already a variant (no variants array), useVariant returns undefined
    const computedVariant = useVariant(product, false, false, controlledVariationValues)

    // Only use computed variant if we have controlled variations AND product has variants array
    // Otherwise use the product as-is (it might already be a variant from cart)
    const variant =
        controlledVariationValues !== null && product?.variants?.length > 0 ? computedVariant : null

    const {data: currentProduct, isFetching} = useProduct(
        {parameters: {id: (variant || product)?.productId}},
        {
            placeholderData: initialProduct,
            ...queryOptions,
            select: (data) => {
                // if the product id is the same as the initial product id,
                // then merge the data with the initial product to be able to show correct quantity in the modal
                if (data.id === initialProduct.productId) {
                    return {
                        ...initialProduct,
                        ...data
                    }
                }
                return data
            },
            onError: () => {
                toast({
                    title: intl.formatMessage(API_ERROR_MESSAGE),
                    status: 'error'
                })
            }
        }
    )

    useEffect(() => {
        if (currentProduct) setProduct(currentProduct)
    }, [currentProduct])

    return {
        product,
        isFetching
    }
}
