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
import {usePageUrls, useSortUrls, useSearchParams} from '../../../hooks'
import useEinstein from '../../../hooks/use-einstein'
import useActiveData from '../../../hooks/use-active-data'
import useDataCloud from '../../../hooks/use-datacloud'
import useNavigation from '../../../hooks/use-navigation'

// Others
import {HTTPNotFound, HTTPError} from '@salesforce/pwa-kit-react-sdk/ssr/universal/errors'
import logger from '../../../utils/logger-instance'

// NOTE: You can ignore certain refinements on a template level by updating the below
// list of ignored refinements.
const REFINEMENT_DISALLOW_LIST = ['c_isNew']

export const useProductListData = () => {
    const navigate = useNavigation()
    const params = useParams()
    const location = useLocation()
    const einstein = useEinstein()
    const dataCloud = useDataCloud()
    const activeData = useActiveData()
    const [searchParams, {stringify: stringifySearchParams}] = useSearchParams()

    const [filtersLoading, setFiltersLoading] = useState(false)

    const urlParams = new URLSearchParams(location.search)
    const searchQuery = urlParams.get('q')
    const isSearch = !!searchQuery

    if (params.categoryId) {
        searchParams._refine.push(`cgid=${params.categoryId}`)
    }

    // _refine is an invalid param for useProductSearch, we don't want to pass it to API call
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

    const basePath = `${location.pathname}${location.search}`
    const showNoResults = !isLoading && productSearchResult && !productSearchResult?.hits
    const {total, sortingOptions} = productSearchResult || {}

    const pageUrls = usePageUrls({total})
    const sortUrls = useSortUrls({options: sortingOptions})

    const toggleFilter = (value, attributeId, selected, allowMultiple = true) => {
        const searchParamsCopy = {...searchParams}

        delete searchParamsCopy.offset

        if (!allowMultiple) {
            const previousValue = searchParamsCopy.refine[attributeId]
            delete searchParamsCopy.refine[attributeId]

            // Note the loose comparison, for "string != number" checks.
            if (!selected && value.value != previousValue) {
                searchParamsCopy.refine[attributeId] = value.value
            }
        } else {
            let attributeValue = searchParamsCopy.refine[attributeId] || []

            if (typeof attributeValue === 'string') {
                attributeValue = attributeValue.split('|')
            } else if (typeof attributeValue === 'number') {
                attributeValue = [attributeValue]
            }

            if (!selected) {
                attributeValue.push(value.value)
            } else {
                attributeValue = attributeValue?.filter((v) => v != value.value)
            }

            searchParamsCopy.refine[attributeId] = attributeValue

            if (searchParamsCopy.refine[attributeId].length === 0) {
                delete searchParamsCopy.refine[attributeId]
            }
        }

        if (isSearch) {
            navigate(`/search?${stringifySearchParams(searchParamsCopy)}`)
        } else {
            navigate(`/category/${params.categoryId}?${stringifySearchParams(searchParamsCopy)}`)
        }
    }

    const resetFilters = () => {
        const newSearchParams = {
            ...searchParams,
            refine: []
        }
        const newPath = isSearch
            ? `/search?${stringifySearchParams(newSearchParams)}`
            : `/category/${params.categoryId}?${stringifySearchParams(newSearchParams)}`

        navigate(newPath)
    }

    useEffect(() => {
        if (productSearchResult) {
            if (isSearch) {
                try {
                    einstein.sendViewSearch(searchQuery, productSearchResult)
                } catch (err) {
                    logger.error('Einstein sendViewSearch error', {
                        namespace: 'ProductList.useEffect',
                        additionalProperties: {error: err, searchQuery}
                    })
                }
                dataCloud.sendViewSearchResults(searchParams, productSearchResult)
                activeData.sendViewSearch(searchParams, productSearchResult)
            } else {
                try {
                    einstein.sendViewCategory(category, productSearchResult)
                } catch (err) {
                    logger.error('Einstein sendViewCategory error', {
                        namespace: 'ProductList.useEffect',
                        additionalProperties: {error: err, category}
                    })
                }
                dataCloud.sendViewCategory(searchParams, category, productSearchResult)
                activeData.sendViewCategory(searchParams, category, productSearchResult)
            }
        }
    }, [productSearchResult, isSearch, searchQuery, category, searchParams, einstein, dataCloud, activeData])

    const handleProductClick = (product) => {
        if (searchQuery) {
            einstein.sendClickSearch(searchQuery, product)
        } else if (category) {
            einstein.sendClickCategory(category, product)
        }
    }

    return {
        basePath,
        category,
        filtersLoading,
        handleProductClick,
        isFetched,
        isLoading,
        isRefetching,
        pageUrls,
        productSearchResult,
        resetFilters,
        searchQuery,
        searchParams,
        showNoResults,
        sortUrls,
        toggleFilter
    }
} 