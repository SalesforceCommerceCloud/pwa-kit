/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect, useState, useMemo} from 'react'
import {removeQueryParamsFromPath} from '../utils/url'
import {useHistory, useLocation} from 'react-router-dom'
import {useVariant} from './use-variant'
import useToast from './use-toast'
import {useIntl} from 'react-intl'
import {API_ERROR_MESSAGE} from '../../config/constants'
import {useProduct} from '@salesforce/commerce-sdk-react'
import {keepPreviousData} from '@tanstack/react-query'

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
    const {formatMessage} = intl
    const toast = useToast()
    const [product, setProduct] = useState(initialProduct)
    const variant = useVariant(product)

    const messages = useMemo(
        () => ({
            apiError: formatMessage(API_ERROR_MESSAGE)
        }),
        [intl]
    )

    const {
        data: currentProduct,
        isFetching,
        isError
    } = useProduct(
        {parameters: {id: (variant || product)?.productId}},
        {
            placeholderData: keepPreviousData,
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
            }
        }
    )

    useEffect(() => {
        if (currentProduct) setProduct(currentProduct)
    }, [currentProduct])

    useEffect(() => {
        if (!isError) return
        toast({
            title: messages.apiError,
            type: 'error'
        })
    }, [isError])

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
            // Do not clean up on unmount in unified bonus modal flow to avoid route change churn
            // The initial cleanup is sufficient to normalize params
        }
    }, [])

    return {
        product,
        variant,
        isFetching
    }
}
