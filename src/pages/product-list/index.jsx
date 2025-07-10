/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useState} from 'react'
import {useLocation, useParams} from 'react-router-dom'
import {keepPreviousData} from '@tanstack/react-query'
import {useCategory, useProductSearch} from '@salesforce/commerce-sdk-react'

// Components
import {
    Box,
    Flex,
    SimpleGrid,
    Grid,
    Stack,
} from '@chakra-ui/react'

// Project Components
import Pagination from '../../components/pagination'
import ProductTile, {Skeleton as ProductTileSkeleton} from '../../components/product-tile'
import Refinements from '../../pages/product-list/partials/refinements'
import CategoryLinks from '../../pages/product-list/partials/category-links'
import EmptySearchResults from '../../pages/product-list/partials/empty-results'
import ProductListBanner from './partials/product-list-banner'
import PageMetadata from './page-metadata'
import PageCache from './page-cache'
import ProductListHeader from './partials/product-list-header'

// Hooks
import {usePageUrls, useSortUrls, useSearchParams, useExtensionConfig} from '../../hooks'
import useEinstein from '../../hooks/use-einstein'
import useActiveData from '../../hooks/use-active-data'
import useDataCloud from '../../hooks/use-datacloud'
import {useProductListWishlist} from './hooks/use-product-list-wishlist'

// Others
import {HTTPNotFound, HTTPError} from '@salesforce/pwa-kit-react-sdk/ssr/universal/errors'
import logger from '../../utils/logger-instance'

// Constants
import useNavigation from '../../hooks/use-navigation'
import {isHydrated} from '../../utils/utils'

// NOTE: You can ignore certain refinements on a template level by updating the below
// list of ignored refinements.
const REFINEMENT_DISALLOW_LIST = ['c_isNew']

/*
 * This is a simple product listing page. It displays a paginated list
 * of product hit objects. Allowing for sorting and filtering based on the
 * allowable filters and sort refinements.
 */
const ProductList = () => {
    const navigate = useNavigation()
    const params = useParams()
    const location = useLocation()
    const einstein = useEinstein()
    const dataCloud = useDataCloud()
    const activeData = useActiveData()
    const [searchParams, {stringify: stringifySearchParams}] = useSearchParams()
    const {
        pages: {ProductList: productListConfig}
    } = useExtensionConfig()
    /**************** Page State ****************/
    const [filtersLoading, setFiltersLoading] = useState(false)
    const {addItem, removeItem, isItemInWishlist} = useProductListWishlist()

    const urlParams = new URLSearchParams(location.search)
    let searchQuery = urlParams.get('q')
    const isSearch = !!searchQuery

    if (params.categoryId) {
        searchParams._refine.push(`cgid=${params.categoryId}`)
    }

    /**************** Mutation Actions ****************/

    /**************** Query Actions ****************/
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

    /**************** Error Handling ****************/
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

    // Reset scroll position when `isRefetching` becomes `true`.
    useEffect(() => {
        isRefetching && window.scrollTo(0, 0)
        setFiltersLoading(isRefetching)
    }, [isRefetching])

    /**************** Render Variables ****************/
    const basePath = `${location.pathname}${location.search}`
    const showNoResults = !isLoading && productSearchResult && !productSearchResult?.hits
    const {total, sortingOptions} = productSearchResult || {}

    // Get urls to be used for pagination, page size changes, and sorting.
    const pageUrls = usePageUrls({total})
    const sortUrls = useSortUrls({options: sortingOptions})

    /**************** Action Handlers ****************/
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
    }, [productSearchResult])

    return (
        <>
            <PageCache />
            <PageMetadata
                category={category}
                searchQuery={searchQuery}
                productSearchResult={productSearchResult}
            />
            <Box
                className="sf-product-list-page"
                data-testid="sf-product-list-page"
                layerStyle="page"
                paddingTop={{base: 6, lg: 8}}
            >
                {showNoResults ? (
                    <EmptySearchResults searchQuery={searchQuery} category={category} />
                ) : (
                    <>
                        <ProductListBanner />
                        <ProductListHeader
                            searchQuery={searchQuery}
                            category={category}
                            productSearchResult={productSearchResult}
                            isLoading={isLoading}
                            filtersLoading={filtersLoading}
                            toggleFilter={toggleFilter}
                            resetFilters={resetFilters}
                            sortUrls={sortUrls}
                            basePath={basePath}
                            searchParams={searchParams}
                        />

                        {/* Body  */}
                        <Grid templateColumns={{base: '1fr', md: '280px 1fr'}} columnGap={6}>
                            <Stack display={{base: 'none', md: 'flex'}}>
                                <Refinements
                                    itemsBefore={
                                        category?.categories
                                            ? [
                                                  <CategoryLinks
                                                      key="itemsBefore"
                                                      category={category}
                                                  />
                                              ]
                                            : undefined
                                    }
                                    isLoading={filtersLoading}
                                    toggleFilter={toggleFilter}
                                    filters={productSearchResult?.refinements}
                                    excludedFilters={['cgid']}
                                    selectedFilters={searchParams.refine}
                                />
                            </Stack>
                            <Box>
                                <SimpleGrid
                                    columns={[2, 2, 3, 3]}
                                    columnGap={4}
                                    rowGap={{base: 12, lg: 16}}
                                >
                                    {isHydrated() &&
                                    ((isRefetching && !isFetched) || !productSearchResult)
                                        ? new Array(searchParams.limit)
                                              .fill(0)
                                              .map((value, index) => (
                                                  <ProductTileSkeleton key={index} />
                                              ))
                                        : productSearchResult?.hits?.map((productSearchItem) => {
                                              const isInWishlist =
                                                  isItemInWishlist(productSearchItem)

                                              return (
                                                  <ProductTile
                                                      data-testid={`sf-product-tile-${productSearchItem.productId}`}
                                                      key={productSearchItem.productId}
                                                      product={productSearchItem}
                                                      enableFavourite={true}
                                                      isFavourite={isInWishlist}
                                                      isRefreshingData={isRefetching && isFetched}
                                                      imageViewType={
                                                          productListConfig.imageViewType
                                                      }
                                                      selectableAttributeId={
                                                          productListConfig.selectableAttributeId
                                                      }
                                                      onClick={() => {
                                                          if (searchQuery) {
                                                              einstein.sendClickSearch(
                                                                  searchQuery,
                                                                  productSearchItem
                                                              )
                                                          } else if (category) {
                                                              einstein.sendClickCategory(
                                                                  category,
                                                                  productSearchItem
                                                              )
                                                          }
                                                      }}
                                                      onFavouriteToggle={(toBeFavourite) => {
                                                          const action = toBeFavourite
                                                              ? addItem
                                                              : removeItem
                                                          return action(productSearchItem)
                                                      }}
                                                      dynamicImageProps={{
                                                          widths: [
                                                              '50vw',
                                                              '50vw',
                                                              '20vw',
                                                              '20vw',
                                                              '25vw'
                                                          ]
                                                      }}
                                                  />
                                              )
                                          })}
                                </SimpleGrid>
                                {/* Footer */}
                                <Flex
                                    justifyContent={['center', 'center', 'flex-start']}
                                    paddingTop={8}
                                >
                                    <Pagination currentURL={basePath} urls={pageUrls} />
                                </Flex>
                            </Box>
                        </Grid>
                    </>
                )}
            </Box>
        </>
    )
}

ProductList.getTemplateName = () => 'product-list'

ProductList.propTypes = {}

export default ProductList
