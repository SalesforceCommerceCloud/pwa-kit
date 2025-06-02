/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'
import {useLocation, useParams} from 'react-router-dom'
import {useProductSearch} from '@salesforce/commerce-sdk-react'

// Components
import {
    Box,
    Flex,
    Heading,
    SimpleGrid,
    Spinner,
    Text,
    Alert,
    AlertIcon,
    Center
} from '@salesforce/retail-react-app/app/components/shared/ui'

// Project Components
import Seo from '@salesforce/retail-react-app/app/components/seo'
import ProductTile from '@salesforce/retail-react-app/app/components/product-tile'

const ProductSearch = ({searchQuery, ...props}) => {
    const intl = useIntl()
    const params = useParams()
    const {search} = useLocation()

    // Get the current search term from URL params, query string, props, or empty string
    const query = params.query || searchQuery || new URLSearchParams(search).get('q') || ''

    const searchParams = {
        parameters: {
            q: query,
            perPricebook: true,
            allVariationProperties: true,
            allImages: true
        }
    }

    const {data: productSearchResult, isLoading, isError, error} = useProductSearch(searchParams)

    // If there is no search term or results, use our default message
    const noResultsFound = !productSearchResult?.hits || productSearchResult.hits.length === 0

    // If we have an actual search term and no results, use the empty search results component
    const showEmptySearchResults = query && noResultsFound

    // If we have no search term and no results, show the standard message
    const showNoQuery = !query && noResultsFound

    return (
        <Box className="sf-product-search-page" data-testid="sf-product-search-page" {...props}>
            {isLoading && (
                <Center py={16}>
                    <Spinner size="xl" color="blue.600" />
                </Center>
            )}

            {isError && (
                <Box my={8}>
                    <Alert status="error">
                        <AlertIcon />
                        <Text>
                            {intl.formatMessage(
                                {
                                    defaultMessage: 'Error loading search results: {message}',
                                    id: 'product_search.error.loading_search_results'
                                },
                                {message: error.message}
                            )}
                        </Text>
                    </Alert>
                </Box>
            )}

            {!isLoading && !isError && (
                <Box layerStyle="page">
                    <Flex align="center">
                        <Heading as="h1" fontSize="2xl" fontWeight="bold" my={4}>
                            {query ? (
                                <FormattedMessage
                                    defaultMessage={'Search Results for "{query}"'}
                                    id="product_search.heading.search_results"
                                    values={{query}}
                                />
                            ) : (
                                <FormattedMessage
                                    defaultMessage="All Products"
                                    id="product_search.heading.all_products"
                                />
                            )}
                        </Heading>
                    </Flex>

                    {showEmptySearchResults && <Box>We couldn't find anything for "{query}"</Box>}

                    {showNoQuery && (
                        <Center py={16}>
                            <Text>
                                <FormattedMessage
                                    defaultMessage="Enter a search term to see products"
                                    id="product_search.message.enter_search_term"
                                />
                            </Text>
                        </Center>
                    )}

                    {!showEmptySearchResults && !showNoQuery && (
                        <>
                            <Text>
                                {productSearchResult.total !== undefined && (
                                    <FormattedMessage
                                        defaultMessage="{count} Results"
                                        id="product_search.label.num_results"
                                        values={{count: productSearchResult.total}}
                                    />
                                )}
                            </Text>

                            <SimpleGrid
                                columns={{base: 2, md: 3, lg: 4}}
                                spacingX={{base: 4, md: 4}}
                                spacingY={{base: 4, md: 8}}
                                py={8}
                            >
                                {productSearchResult.hits.map((product) => (
                                    <ProductTile
                                        key={product.productId}
                                        product={product}
                                        enableFavourite={true}
                                        eventType="search"
                                        eventValue={query}
                                    />
                                ))}
                            </SimpleGrid>
                        </>
                    )}
                </Box>
            )}
        </Box>
    )
}

ProductSearch.getTemplateName = () => 'product-search'

ProductSearch.propTypes = {
    searchQuery: PropTypes.string
}

export default ProductSearch 