/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useEffect} from 'react'
import {rebuildPathWithParams, removeQueryParamsFromPath} from '../utils/url'
import {useHistory, useLocation} from 'react-router-dom'
import {useVariant} from './use-variant'
import {useToast} from './use-toast'
import {useIntl} from 'react-intl'
import {API_ERROR_MESSAGE} from '../constants'
import {useProduct} from 'commerce-sdk-react-preview'

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
    const urlParams = new URLSearchParams(location.search)
    const pid = urlParams.get('pid')
    // use commerce-sdk-react-preview useProduct to fetch new product detail whenever variant changes
    const {data: product, isFetching} = useProduct(
        {id: pid},
        {
            // Show initialTodos immediately, but won't refetch until another interaction event is encountered after 1000 ms
            initialData: initialProduct,
            // when the modal is first mounted, don't need to fetch current product detail since it is available
            enabled: !!pid,
            onSuccess: (data) => {
                console.log('data.productId', data.id)
                // if the product id is the same as the initial product id, then merge the data with the initial product
                if (data.id === initialProduct.productId) {
                    return {
                        ...initialProduct,
                        ...data
                    }
                }
            },
            onError: () => {
                toast({
                    title: intl.formatMessage(API_ERROR_MESSAGE),
                    status: 'error'
                })
            }
        }
    )
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
        if (variant) {
            // console.log('variant change')
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
