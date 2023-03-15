/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState} from 'react'
import {rebuildPathWithParams, removeQueryParamsFromPath} from '../utils/url'
import {useHistory, useLocation} from 'react-router-dom'
import {useCommerceAPI} from '../commerce-api/contexts'
import {isError} from '../commerce-api/utils'
import {useVariant} from './use-variant'
import {useToast} from './use-toast'
import {useIntl} from 'react-intl'
import {API_ERROR_MESSAGE} from '../constants'

/**
 * This hooks is responsible for fetching a product detail based on the variation selection
 * and managing the variation params on the url when the modal is open/close
 * @param initialProduct - the initial product when the modal is first open
 * @returns object
 */
export const useProductViewModal = (initialProduct) => {
    const location = useLocation()
    const api = useCommerceAPI()
    const history = useHistory()
    const intl = useIntl()
    const [product, setProduct] = useState(initialProduct)
    const [isFetching, setIsFetching] = useState(false)
    const toast = useToast()
    const variant = useVariant(product)
    const cleanUpVariantParams = () => {
        const paramToRemove = [...product.variationAttributes.map(({id}) => id), 'pid']
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
        // getting product detail based on variant selection for stockLevel
        const getProductDetailByVariant = async () => {
            // Fetch the product detail when the user select different variant
            if (variant && variant.productId !== product?.id) {
                setIsFetching(true)
                const res = await api.shopperProducts.getProduct({
                    parameters: {
                        id: variant.productId,
                        allImages: true
                    }
                })
                if (isError(res)) {
                    setIsFetching(false)
                    toast({
                        title: intl.formatMessage(API_ERROR_MESSAGE),
                        status: 'error'
                    })
                    throw new Error(res)
                }
                setProduct(res)
                setIsFetching(false)
            }
        }
        if (variant) {
            const {variationValues} = variant
            // update the url with the new product id and variation values when the variant changes
            const updatedUrl = rebuildPathWithParams(`${location.pathname}${location.search}`, {
                ...variationValues,
                pid: variant.productId
            })
            history.replace(updatedUrl)
        }
        getProductDetailByVariant()
    }, [variant])

    return {
        product,
        variant,
        isFetching
    }
}
