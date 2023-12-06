/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage, useIntl} from 'react-intl'

import {Box, Flex, Stack, Button} from '@salesforce/retail-react-app/app/components/shared/ui'
import {HideOnDesktop} from '@salesforce/retail-react-app/app/components/responsive'
import {FilterIcon, ChevronDownIcon} from '@salesforce/retail-react-app/app/components/icons'
import SelectedRefinements from '@salesforce/retail-react-app/app/pages/product-list/partials/selected-refinements'
import PageHeader from '@salesforce/retail-react-app/app/pages/product-list/partials/page-header'
import AbovePageHeader from '@salesforce/retail-react-app/app/pages/product-list/partials/above-page-header'
import Sort from '@salesforce/retail-react-app/app/pages/product-list/partials/sort'

const ProductListHeader = (props) => {
    const {
        searchQuery,
        category,
        productSearchResult,
        isLoading,
        toggleFilter,
        resetFilters,
        sortUrls,
        basePath,
        onOpen,
        setSortOpen,
        selectedSort
    } = props
    const {formatMessage} = useIntl()
    return (
        <>
            <AbovePageHeader />
            <Stack
                display={{base: 'none', lg: 'flex'}}
                direction="row"
                justify="flex-start"
                align="flex-start"
                spacing={4}
                marginBottom={6}
            >
                <Flex align="left" width="287px">
                    <PageHeader
                        searchQuery={searchQuery}
                        category={category}
                        productSearchResult={productSearchResult}
                        isLoading={isLoading}
                    />
                </Flex>

                <Box flex={1} paddingTop={'45px'}>
                    <SelectedRefinements
                        filters={productSearchResult?.refinements}
                        toggleFilter={toggleFilter}
                        handleReset={resetFilters}
                        selectedFilterValues={productSearchResult?.selectedRefinements}
                    />
                </Box>
                <Box paddingTop={'45px'}>
                    <Sort
                        sortUrls={sortUrls}
                        productSearchResult={productSearchResult}
                        basePath={basePath}
                    />
                </Box>
            </Stack>

            <HideOnDesktop>
                <Stack spacing={6}>
                    <PageHeader
                        searchQuery={searchQuery}
                        category={category}
                        productSearchResult={productSearchResult}
                        isLoading={isLoading}
                    />
                    <Stack
                        display={{base: 'flex', md: 'none'}}
                        direction="row"
                        justify="flex-start"
                        align="center"
                        spacing={1}
                        height={12}
                        borderColor="gray.100"
                    >
                        <Flex align="center">
                            <Button
                                fontSize="sm"
                                colorScheme="black"
                                variant="outline"
                                marginRight={2}
                                display="inline-flex"
                                leftIcon={<FilterIcon boxSize={5} />}
                                onClick={onOpen}
                            >
                                <FormattedMessage
                                    defaultMessage="Filter"
                                    id="product_list.button.filter"
                                />
                            </Button>
                        </Flex>
                        <Flex align="center">
                            <Button
                                maxWidth="245px"
                                fontSize="sm"
                                marginRight={2}
                                colorScheme="black"
                                variant="outline"
                                display="inline-flex"
                                rightIcon={<ChevronDownIcon boxSize={5} />}
                                onClick={() => setSortOpen(true)}
                            >
                                {formatMessage(
                                    {
                                        id: 'product_list.button.sort_by',
                                        defaultMessage: 'Sort By: {sortOption}'
                                    },
                                    {
                                        sortOption: selectedSort?.label
                                    }
                                )}
                            </Button>
                        </Flex>
                    </Stack>
                </Stack>
                <Box marginBottom={4}>
                    <SelectedRefinements
                        filters={productSearchResult?.refinements}
                        toggleFilter={toggleFilter}
                        handleReset={resetFilters}
                        selectedFilterValues={productSearchResult?.selectedRefinements}
                    />
                </Box>
            </HideOnDesktop>
        </>
    )
}

ProductListHeader.propTypes = {
    searchQuery: PropTypes.string,
    category: PropTypes.object,
    productSearchResult: PropTypes.object,
    isLoading: PropTypes.bool,
    toggleFilter: PropTypes.func,
    resetFilters: PropTypes.func,
    sortUrls: PropTypes.arrayOf(PropTypes.string),
    basePath: PropTypes.string,
    onOpen: PropTypes.func,
    setSortOpen: PropTypes.func,
    selectedSort: PropTypes.object
}

export default ProductListHeader
