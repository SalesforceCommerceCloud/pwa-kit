/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useEffect, useState} from 'react'
import {useLocation, useParams} from 'react-router-dom'
import {keepPreviousData} from '@tanstack/react-query'
import {useCategory, useProductSearch} from '@salesforce/commerce-sdk-react'

// Hooks
import {useSearchParams} from '../../../hooks'
import useEinstein from '../../../hooks/use-einstein'

// Others
import {HTTPNotFound, HTTPError} from '@salesforce/pwa-kit-react-sdk/ssr/universal/errors'

// NOTE: You can ignore certain refinements on a template level by updating the below
// list of ignored refinements.
const REFINEMENT_DISALLOW_LIST = ['c_isNew']

export const useProductListData = () => {
    const params = useParams()
    const location = useLocation()
    const einstein = useEinstein()
    const [searchParams] = useSearchParams()

    const [filtersLoading, setFiltersLoading] = useState(false)

    const urlParams = new URLSearchParams(location.search)
    const searchQuery = urlParams.get('q')
    const isSearch = !!searchQuery

    if (params.categoryId) {
        searchParams._refine.push(`cgid=${params.categoryId}`)
    }

    const {_refine, ...restOfParams} = searchParams

    const {
        isLoading,
        isFetched,
        isRefetching,
        data: productSearchResult
    } = useProductSearch(
        {
            parameters: {
                ...restOfParams,
                perPricebook: true,
                allVariationProperties: true,
                allImages: true,
                expand: [
                    'promotions',
                    'variations',
                    'prices',
                    'images',
                    'page_meta_tags',
                    'custom_properties'
                ],
                refine: _refine
            }
        },
        {
            placeholderData: keepPreviousData
        }
    )

    const {error, data: category} = useCategory(
        {
            parameters: {
                id: params.categoryId
            }
        },
        {
            enabled: !isSearch && !!params.categoryId
        }
    )

    // Apply disallow list to refinements.
    if (productSearchResult?.refinements) {
        productSearchResult.refinements = productSearchResult.refinements.filter(
            ({attributeId}) => !REFINEMENT_DISALLOW_LIST.includes(attributeId)
        )
    }

    const errorStatus = error?.response?.status
    switch (errorStatus) {
        case undefined:
            // No Error.
            break
        case 404:
            throw new HTTPNotFound('Category Not Found.')
        default:
            throw new HTTPError(errorStatus, `HTTP Error ${errorStatus} occurred.`)
    }

    useEffect(() => {
        isRefetching && window.scrollTo(0, 0)
        setFiltersLoading(isRefetching)
    }, [isRefetching])

    const showNoResults = !isLoading && productSearchResult && !productSearchResult?.hits

    const handleProductClick = (product) => {
        if (searchQuery) {
            einstein.sendClickSearch(searchQuery, product)
        } else if (category) {
            einstein.sendClickCategory(category, product)
        }
    }

    return {
        category,
        filtersLoading,
        handleProductClick,
        isFetched,
        isLoading,
        isRefetching,
        isSearch,
        productSearchResult,
        searchQuery,
        showNoResults
    }
}
