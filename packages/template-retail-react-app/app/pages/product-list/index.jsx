/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import PropTypes from 'prop-types'
import {useLocation, useParams} from 'react-router-dom'
import {Helmet} from 'react-helmet'
import {useCategory, useProductSearch} from '@salesforce/commerce-sdk-react'
import {useServerContext} from '@salesforce/pwa-kit-react-sdk/ssr/universal/hooks'

// Components
import {Box, useDisclosure} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import EmptySearchResults from '@salesforce/retail-react-app/app/pages/product-list/partials/empty-results'
import ProductListBody from '@salesforce/retail-react-app/app/pages/product-list/partials/body'
import ProductListHeader from '@salesforce/retail-react-app/app/pages/product-list/partials/header'

// Hooks
import {
    useActiveData,
    useEinstein,
    useNavigation,
    useSortUrls,
    useSearchParams
} from '@salesforce/retail-react-app/app/hooks'

// Others
import {HTTPNotFound, HTTPError} from '@salesforce/pwa-kit-react-sdk/ssr/universal/errors'
import {MAX_CACHE_AGE} from '@salesforce/retail-react-app/app/constants'
import MobileSortPicker from '@salesforce/retail-react-app/app/pages/product-list/partials/mobile-sort-picker'
import MobileRefinements from '@salesforce/retail-react-app/app/pages/product-list/partials/mobile-refinements'

// NOTE: You can ignore certain refinements on a template level by updating the below
// list of ignored refinements.
const REFINEMENT_DISALLOW_LIST = ['c_isNew']

/*
 * This is a simple product listing page. It displays a paginated list
 * of product hit objects. Allowing for sorting and filtering based on the
 * allowable filters and sort refinements.
 */
const ProductList = (props) => {
    // Using destructuring to omit properties; we must rename `isLoading` because we use a different
    // `isLoading` later in this function.
    // eslint-disable-next-line react/prop-types, @typescript-eslint/no-unused-vars
    const {isLoading: _unusedIsLoading, staticContext, ...rest} = props
    const {isOpen, onOpen, onClose} = useDisclosure()
    const navigate = useNavigation()
    const params = useParams()
    const location = useLocation()
    const einstein = useEinstein()
    const activeData = useActiveData()
    const {res} = useServerContext()
    const [searchParams, {stringify: stringifySearchParams}] = useSearchParams()

    /**************** Page State ****************/
    const [sortOpen, setSortOpen] = useState(false)

    const urlParams = new URLSearchParams(location.search)
    let searchQuery = urlParams.get('q')
    const isSearch = !!searchQuery

    if (params.categoryId) {
        searchParams._refine.push(`cgid=${params.categoryId}`)
    }

    /**************** Query Actions ****************/
    const {
        isLoading,
        isRefetching,
        data: productSearchResult
    } = useProductSearch(
        {
            parameters: {
                ...searchParams,
                refine: searchParams._refine
            }
        },
        {
            keepPreviousData: true
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

    /**************** Error Handling ****************/
    const errorStatus = error?.response?.status
    switch (errorStatus) {
        case undefined:
            // No Error.
            break
        case 404:
            throw new HTTPNotFound('Category Not Found.')
        default:
            throw new HTTPError(`HTTP Error ${errorStatus} occurred.`)
    }

    /**************** Response Handling ****************/
    if (res) {
        res.set('Cache-Control', `s-maxage=${MAX_CACHE_AGE}`)
    }

    // Reset scroll position when refetching data
    useEffect(() => {
        if (isRefetching) window.scrollTo(0, 0)
    }, [isRefetching])

    /**************** Render Variables ****************/
    const basePath = `${location.pathname}${location.search}`
    const showNoResults = !isLoading && productSearchResult && !productSearchResult?.hits
    const {sortingOptions} = productSearchResult || {}
    const selectedSortingOptionLabel =
        sortingOptions?.find(
            (option) => option.id === productSearchResult?.selectedSortingOption
        ) ?? sortingOptions?.[0]

    // Get urls to be used for pagination, page size changes, and sorting.
    const sortUrls = useSortUrls({options: sortingOptions})

    // Toggles filter on and off
    const toggleFilter = (value, attributeId, selected, allowMultiple = true) => {
        const searchParamsCopy = {...searchParams}

        // Remove the `offset` search param if present.
        delete searchParamsCopy.offset

        // If we aren't allowing for multiple selections, simply clear any value set for the
        // attribute, and apply a new one if required.
        if (!allowMultiple) {
            const previousValue = searchParamsCopy.refine[attributeId]
            delete searchParamsCopy.refine[attributeId]

            // Note the loose comparison, for "string != number" checks.
            if (!selected && value.value != previousValue) {
                searchParamsCopy.refine[attributeId] = value.value
            }
        } else {
            // Get the attibute value as an array.
            let attributeValue = searchParamsCopy.refine[attributeId] || []

            // Ensure that the value is still converted into an array if it's a `string` or `number`.
            if (typeof attributeValue === 'string') {
                attributeValue = attributeValue.split('|')
            } else if (typeof attributeValue === 'number') {
                attributeValue = [attributeValue]
            }

            // Either set the value, or filter the value out.
            if (!selected) {
                attributeValue.push(value.value)
            } else {
                // Note the loose comparison, for "string != number" checks.
                attributeValue = attributeValue?.filter((v) => v != value.value)
            }

            // Update the attribute value in the new search params.
            searchParamsCopy.refine[attributeId] = attributeValue

            // If the update value is an empty array, remove the current attribute key.
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

    // Clears all filters
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

    /**************** Einstein ****************/
    useEffect(() => {
        if (productSearchResult) {
            if (isSearch) {
                try {
                    einstein.sendViewSearch(searchQuery, productSearchResult)
                } catch (err) {
                    console.error(err)
                }
                activeData.sendViewSearch(searchParams, productSearchResult)
            } else {
                try {
                    einstein.sendViewCategory(category, productSearchResult)
                } catch (err) {
                    console.error(err)
                }
                activeData.sendViewCategory(searchParams, category, productSearchResult)
            }
        }
    }, [productSearchResult])

    return (
        <Box
            className="sf-product-list-page"
            data-testid="sf-product-list-page"
            layerStyle="page"
            paddingTop={{base: 6, lg: 8}}
            {...rest}
        >
            <Helmet>
                <title>{category?.pageTitle ?? searchQuery}</title>
                <meta name="description" content={category?.pageDescription ?? searchQuery} />
                <meta name="keywords" content={category?.pageKeywords} />
            </Helmet>
            {showNoResults ? (
                <EmptySearchResults searchQuery={searchQuery} category={category} />
            ) : (
                <>
                    <ProductListHeader
                        searchQuery={searchQuery}
                        category={category}
                        productSearchResult={productSearchResult}
                        isLoading={isLoading}
                        toggleFilter={toggleFilter}
                        resetFilters={resetFilters}
                        sortUrls={sortUrls}
                        basePath={basePath}
                        onOpen={onOpen}
                        setSortOpen={setSortOpen}
                        selectedSortingOptionLabel={selectedSortingOptionLabel}
                    ></ProductListHeader>
                    <ProductListBody
                        toggleFilter={toggleFilter}
                        productSearchResult={productSearchResult}
                        searchParams={searchParams}
                        isRefetching={isRefetching}
                        searchQuery={searchQuery}
                        category={category}
                        basePath={basePath}
                    ></ProductListBody>
                </>
            )}
            <MobileRefinements
                isOpen={isOpen}
                onClose={onClose}
                isRefetching={isRefetching}
                toggleFilter={toggleFilter}
                productSearchResult={productSearchResult}
                searchParams={searchParams}
                resetFilters={resetFilters}
            ></MobileRefinements>
            <MobileSortPicker
                sortOpen={sortOpen}
                setSortOpen={setSortOpen}
                sortUrls={sortUrls}
                selectedSortingOptionLabel={selectedSortingOptionLabel}
                productSearchResult={productSearchResult}
            ></MobileSortPicker>
        </Box>
    )
}

ProductList.getTemplateName = () => 'product-list'

ProductList.propTypes = {
    onAddToWishlistClick: PropTypes.func,
    onRemoveWishlistClick: PropTypes.func,
    category: PropTypes.object
}

export default ProductList
