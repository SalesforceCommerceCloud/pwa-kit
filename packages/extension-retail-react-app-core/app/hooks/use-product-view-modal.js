/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState} from 'react'
import {
    rebuildPathWithParams,
    removeQueryParamsFromPath
} from '@salesforce/retail-react-app/app/utils/url'
import {useHistory, useLocation} from 'react-router-dom'
import {useVariant} from '@salesforce/retail-react-app/app/hooks/use-variant'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useIntl} from 'react-intl'
import {API_ERROR_MESSAGE} from '@salesforce/retail-react-app/app/constants'
import {useProduct} from '@salesforce/commerce-sdk-react'

/**
 * This hook is responsible for fetching a product detail based on the variation selection
 * and managing the variation params on the url when the modal is open/close
 * @param initialProduct - the initial product when the modal is first open
 * @returns object
 */
export const useProductViewModal = (initialProduct) => {
    const location = useLocation()
    const history = useHistory()
    const intl = useIntl()
    const toast = useToast()
    const [product, setProduct] = useState(initialProduct)
    const variant = useVariant(product)

    const {isFetching} = useProduct(
        {parameters: {id: variant?.productId}},
        {
            placeholderData: initialProduct,
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
            onSuccess: (data) => {
                setProduct(data)
            },
            onError: () => {
                toast({
                    title: intl.formatMessage(API_ERROR_MESSAGE),
                    status: 'error'
                })
            }
        }
    )
    const cleanUpVariantParams = () => {
        const paramToRemove = [...(product?.variationAttributes?.map(({id}) => id) ?? []), 'pid']
        const updatedParams = removeQueryParamsFromPath(`${location.search}`, paramToRemove)

        history.replace({search: updatedParams})
    }

    useEffect(() => {
        // when the modal is first mounted,
        // clean up the params in case there are variant params not related to current product
        cleanUpVariantParams()
        return () => {
            cleanUpVariantParams()
        }
    }, [])

    useEffect(() => {
        if (variant) {
            const {variationValues} = variant
            // update the url with the new product id and variation values when the variant changes
            const updatedUrl = rebuildPathWithParams(`${location.pathname}${location.search}`, {
                ...variationValues,
                pid: variant.productId
            })
            history.replace(updatedUrl)
        }
    }, [variant])

    return {
        product,
        variant,
        isFetching
    }
}
