/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useMemo} from 'react'
import PropTypes from 'prop-types'
import {useHistory} from 'react-router-dom'
import {useIntl} from 'react-intl'
import {Box, Button, Dialog, Drawer, Flex, Heading, Stack, Text} from '@chakra-ui/react'
import {FilterIcon, ChevronDownIcon} from '../../../components/icons'
import SafePortal from '../../../components/safe-portal'
import LoadingSpinner from '../../../components/loading-spinner'
import {HideOnDesktop} from '../../../components/responsive'
import Refinements from '../partials/refinements'
import CategoryLinks from '../partials/category-links'
import SelectedRefinements from '../partials/selected-refinements'
import PageTitle from './product-list-title'
import Sort from '../partials/sort'

const ProductListHeader = ({
    searchQuery,
    category,
    productSearchResult,
    isLoading,
    filtersLoading,
    toggleFilter,
    resetFilters,
    sortUrls,
    basePath,
    searchParams
}) => {
    const intl = useIntl()
    const {formatMessage} = intl
    const history = useHistory()
    const [sortOpen, setSortOpen] = useState(false)

    const {sortingOptions} = productSearchResult || {}
    const selectedSortingOptionLabel =
        sortingOptions?.find(
            (option) => option.id === productSearchResult?.selectedSortingOption
        ) ?? sortingOptions?.[0]

    const messages = useMemo(() => ({
        sortBy: formatMessage(
            {
                id: 'product_list.button.sort_by',
                defaultMessage: 'Sort By: {sortOption}'
            },
            {
                sortOption: selectedSortingOptionLabel?.label
            }
        ),
        filter: formatMessage({
            id: 'product_list.button.filter',
            defaultMessage: 'Filter'
        }),
        filterTitle: formatMessage({
            id: 'product_list.modal.title.filter',
            defaultMessage: 'Filter'
        }),
        viewItems: (count) => formatMessage({
            id: 'product_list.modal.btn.view_items',
            defaultMessage: 'View {count} Items'
        }, {count}),
        clearFilters: formatMessage({
            id: 'product_list.modal.btn.clear_filters',
            defaultMessage: 'Clear Filters'
        }),
        sortByTitle: formatMessage({
            id: 'product_list.drawer.title.sort_by',
            defaultMessage: 'Sort By'
        })
    }), [intl])

    return (
        <>
            {/* Header for Desktop */}
            <Stack
                display={{base: 'none', lg: 'flex'}}
                direction="row"
                justify="flex-start"
                align="flex-start"
                gap={4}
                marginBottom={6}
            >
                <Flex align="left" width="287px">
                    <PageTitle
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

            {/* Filter Button for Mobile */}
            <HideOnDesktop>
                <Stack gap={6}>
                    <PageTitle
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
                        gap={1}
                        height={12}
                        borderColor="gray.100"
                    >
                        <Flex align="center">
                            {/* Modal for filter options on mobile */}
                            <Dialog.Root size="full" placement="center">
                                <Dialog.Trigger asChild>
                                    <Button
                                        fontSize="sm"
                                        colorPalette="black"
                                        variant="outline"
                                        marginRight={2}
                                        display="inline-flex"
                                        color="black"
                                    >
                                        <FilterIcon boxSize={5} />
                                        {messages.filter}
                                    </Button>
                                </Dialog.Trigger>
                                <SafePortal>
                                    <Dialog.Backdrop />
                                    <Dialog.Positioner>
                                        <Dialog.Content
                                            display="flex"
                                            flexDirection="column"
                                            height="100vh"
                                        >
                                            <Dialog.Header
                                                flexShrink={0}
                                                bg="white"
                                                borderBottom="1px solid"
                                                borderBottomColor="gray.100"
                                                p={4}
                                            >
                                                <Dialog.Title asChild>
                                                    <Heading
                                                        as="h1"
                                                        fontWeight="bold"
                                                        fontSize="2xl"
                                                    >
                                                        {messages.filterTitle}
                                                    </Heading>
                                                </Dialog.Title>
                                                <Dialog.CloseTrigger asChild>
                                                    <Button variant="ghost" size="sm">
                                                        ✕
                                                    </Button>
                                                </Dialog.CloseTrigger>
                                            </Dialog.Header>
                                            <Dialog.Body flex={1} overflowY="auto" px={4} py={4}>
                                                {filtersLoading && <LoadingSpinner />}
                                                <Refinements
                                                    toggleFilter={toggleFilter}
                                                    filters={productSearchResult?.refinements}
                                                    selectedFilters={searchParams.refine}
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
                                                    excludedFilters={['cgid']}
                                                />
                                            </Dialog.Body>
                                            <Dialog.Footer
                                                flexShrink={0}
                                                bg="white"
                                                borderTop="1px solid"
                                                borderTopColor="gray.100"
                                                p={4}
                                            >
                                                <Stack direction="column" gap={3} width="full">
                                                    <Dialog.CloseTrigger asChild>
                                                        <Button
                                                            width="full"
                                                            colorPalette="blue"
                                                            size="lg"
                                                            position="static"
                                                        >
                                                            {messages.viewItems(productSearchResult?.total || 0)}
                                                        </Button>
                                                    </Dialog.CloseTrigger>
                                                    <Dialog.CloseTrigger asChild>
                                                        <Button
                                                            width="full"
                                                            variant="outline"
                                                            size="lg"
                                                            position="static"
                                                            onClick={resetFilters}
                                                        >
                                                            {messages.clearFilters}
                                                        </Button>
                                                    </Dialog.CloseTrigger>
                                                </Stack>
                                            </Dialog.Footer>
                                        </Dialog.Content>
                                    </Dialog.Positioner>
                                </SafePortal>
                            </Dialog.Root>
                        </Flex>
                        <Flex align="center">
                            <Button
                                maxWidth="245px"
                                fontSize="sm"
                                marginRight={2}
                                colorPalette="black"
                                variant="outline"
                                display="inline-flex"
                                color="black"
                                onClick={() => setSortOpen(true)}
                            >
                                {messages.sortBy}
                                <ChevronDownIcon boxSize={5} />
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

            {/* Sort Drawer */}
            <Drawer.Root
                open={sortOpen}
                onOpenChange={(e) => !e.open && setSortOpen(false)}
                placement="bottom"
                size="sm"
            >
                <SafePortal>
                    <Drawer.Backdrop />
                    <Drawer.Positioner>
                        <Drawer.Content>
                            <Drawer.Header>
                                <Drawer.Title>
                                    <Text fontWeight="bold" fontSize="2xl">
                                        {messages.sortByTitle}
                                    </Text>
                                </Drawer.Title>
                                <Drawer.CloseTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                        ✕
                                    </Button>
                                </Drawer.CloseTrigger>
                            </Drawer.Header>
                            <Drawer.Body>
                                {sortUrls.map((href, idx) => (
                                    <Button
                                        width="full"
                                        onClick={() => {
                                            setSortOpen(false)
                                            history.push(href)
                                        }}
                                        fontSize={'md'}
                                        key={idx}
                                        marginTop={0}
                                        variant="ghost"
                                        justifyContent="flex-start"
                                        mb={2}
                                    >
                                        <Text
                                            as={
                                                selectedSortingOptionLabel?.label ===
                                                    productSearchResult?.sortingOptions[idx]
                                                        ?.label && 'u'
                                            }
                                        >
                                            {productSearchResult?.sortingOptions[idx]?.label}
                                        </Text>
                                    </Button>
                                ))}
                            </Drawer.Body>
                        </Drawer.Content>
                    </Drawer.Positioner>
                </SafePortal>
            </Drawer.Root>
        </>
    )
}

ProductListHeader.propTypes = {
    searchQuery: PropTypes.string,
    category: PropTypes.object,
    productSearchResult: PropTypes.object,
    isLoading: PropTypes.bool,
    filtersLoading: PropTypes.bool,
    toggleFilter: PropTypes.func,
    resetFilters: PropTypes.func,
    sortUrls: PropTypes.array,
    basePath: PropTypes.string,
    searchParams: PropTypes.object
}

export default ProductListHeader
