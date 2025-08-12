/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useLocation, useParams} from 'react-router-dom'
import {usePageUrls, useSortUrls, useSearchParams} from '../../../hooks'
import {useNavigation} from '../../../hooks/use-navigation'

/**
 * A hook for managing the controls of a product list page (PLP).
 * It handles state related to filtering, sorting, and pagination by
 * manipulating the URL search parameters.
 *
 * @param {object} props
 * @param {object} props.productSearchResult - The search result object from the API.
 * @param {boolean} props.isSearch - Indicates if the current page is a search results page.
 * @returns {object} The state and methods for controlling the product list.
 */
export const useProductListControls = ({productSearchResult, isSearch}) => {
    const navigate = useNavigation()
    const params = useParams()
    const location = useLocation()
    const [searchParams, {stringify: stringifySearchParams}] = useSearchParams()

    const basePath = `${location.pathname}${location.search}`
    const {total, sortingOptions} = productSearchResult || {}

    const pageUrls = usePageUrls({total})
    const sortUrls = useSortUrls({options: sortingOptions})

    const toggleFilter = (value, attributeId, selected, allowMultiple = true) => {
        const searchParamsCopy = {...searchParams}

        // Reset pagination when a filter changes
        delete searchParamsCopy.offset

        if (!allowMultiple) {
            const previousValue = searchParamsCopy.refine?.[attributeId]
            // We initialize refine here, so we can safely delete/set the attributeId.
            if (!searchParamsCopy.refine) {
                searchParamsCopy.refine = {}
            }
            delete searchParamsCopy.refine[attributeId]

            // Note the loose comparison, for "string != number" checks.
            if (!selected && value.value != previousValue) {
                searchParamsCopy.refine[attributeId] = value.value
            }
        } else {
            let attributeValue = searchParamsCopy.refine?.[attributeId] || []

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

            if (!searchParamsCopy.refine) {
                searchParamsCopy.refine = {}
            }
            searchParamsCopy.refine[attributeId] = attributeValue

            if (searchParamsCopy.refine[attributeId].length === 0) {
                delete searchParamsCopy.refine[attributeId]
            }
        }

        const newUrl = isSearch
            ? `/search?${stringifySearchParams(searchParamsCopy)}`
            : `/category/${params.categoryId}?${stringifySearchParams(searchParamsCopy)}`

        navigate(newUrl)
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

    return {
        basePath,
        pageUrls,
        sortUrls,
        toggleFilter,
        resetFilters,
        searchParams
    }
}
