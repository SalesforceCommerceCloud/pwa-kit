/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Box, Grid, Stack} from '@chakra-ui/react'

// Project Components
import PageMetadata from './page-metadata'
import PageCache from './page-cache'
import Refinements from './partials/refinements'
import CategoryLinks from './partials/category-links'
import EmptySearchResults from './partials/empty-results'
import ProductListBanner from './partials/product-list-banner'
import ProductListHeader from './partials/product-list-header'
import ProductListGrid from './partials/product-list-grid'
import ProductListPagination from './partials/product-list-pagination'
import PageAnalytics from './page-analytics'

// Hooks
import {useExtensionConfig} from '../../hooks'
import {useProductListWishlist} from './hooks/use-product-list-wishlist'
import {useProductListData} from './hooks/use-product-list-data'
import {useProductListControls} from './hooks/use-product-list-controls'

/*
 * This is a simple product listing page. It displays a paginated list
 * of product hit objects. Allowing for sorting and filtering based on the
 * allowable filters and sort refinements.
 */
const ProductList = () => {
    const {
        pages: {ProductList: productListConfig}
    } = useExtensionConfig()
    const {toggleItem, isItemInWishlist} = useProductListWishlist()

    const {
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
    } = useProductListData()

    const {basePath, pageUrls, sortUrls, toggleFilter, resetFilters, searchParams} =
        useProductListControls({productSearchResult, isSearch})

    return (
        <>
            <PageCache />
            <PageAnalytics
                category={category}
                searchQuery={searchQuery}
                productSearchResult={productSearchResult}
                isSearch={isSearch}
                searchParams={searchParams}
            />
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
                                <ProductListGrid
                                    isFetched={isFetched}
                                    isRefetching={isRefetching}
                                    productSearchResult={productSearchResult}
                                    searchParams={searchParams}
                                    productListConfig={productListConfig}
                                    isItemInWishlist={isItemInWishlist}
                                    onClickProduct={handleProductClick}
                                    onFavouriteToggle={toggleItem}
                                />
                                <ProductListPagination basePath={basePath} pageUrls={pageUrls} />
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
