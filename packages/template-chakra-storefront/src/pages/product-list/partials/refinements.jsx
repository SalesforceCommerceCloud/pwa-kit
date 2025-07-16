/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Heading, Stack, Accordion} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import ColorRefinements from '../../../pages/product-list/partials/color-refinements'
import SizeRefinements from '../../../pages/product-list/partials/size-refinements'
import RadioRefinements from '../../../pages/product-list/partials/radio-refinements'
import CheckboxRefinements from '../../../pages/product-list/partials/checkbox-refinements'
import LinkRefinements from '../../../pages/product-list/partials/link-refinements'
import {isServer} from '../../../utils/utils'
import {useExtensionConfig} from '../../../hooks'

/** Map of refinement attribute IDs to the components used to display values as filter options. */
export const componentMap = {
    cgid: LinkRefinements,
    c_refinementColor: ColorRefinements,
    c_size: SizeRefinements,
    price: RadioRefinements
}

const Refinements = ({
    itemsBefore,
    excludedFilters = [],
    filters = [],
    toggleFilter,
    selectedFilters,
    isLoading
}) => {
    const {
        pages: {ProductList: productListConfig}
    } = useExtensionConfig()
    const FILTER_ACCORDION_STATE = productListConfig.filterAccordionState
    // Exclude filters in the exclude list.
    if (excludedFilters) {
        filters = filters.filter(({attributeId}) => !excludedFilters.includes(attributeId))
    }

    // Getting the indices of filters to open accordions by default
    let filtersIndexes = filters?.map((filter, idx) => idx)

    // Use saved state for accordions
    if (!isServer) {
        // TODO: Change this to `useLocalStorage` hook when localStorage detection is more robust
        const filterAccordionState = window.localStorage.getItem(FILTER_ACCORDION_STATE)
        const savedExpandedAccordionIndexes =
            filterAccordionState && JSON.parse(filterAccordionState)

        if (savedExpandedAccordionIndexes) {
            filtersIndexes = filters
                ?.map((filter, index) => {
                    if (savedExpandedAccordionIndexes.includes(filter.attributeId)) {
                        return index
                    }
                })
                .filter((index) => index !== undefined)
        }
    }

    // Handle saving accordion state
    const updateAccordionState = (expandedValues) => {
        const expandedIndexes = expandedValues.map(Number).filter((idx) => !isNaN(idx))
        const filterState = filters
            ?.filter((filter, index) => expandedIndexes.includes(index))
            .map((filter) => filter.attributeId)

        // TODO: Update when localStorage detection is more robust? useLocalStorage is only a getter
        window.localStorage.setItem(FILTER_ACCORDION_STATE, JSON.stringify(filterState))
    }

    return (
        <Stack gap={8}>
            {/* Wait to have filters before rendering the Accordion to allow the default indexes to be accurate */}
            {filtersIndexes && (
                <Accordion.Root
                    multiple
                    defaultValue={filtersIndexes.map(String)}
                    onValueChange={(details) => updateAccordionState(details.value)}
                    style={{
                        pointerEvents: isLoading ? 'none' : 'auto',
                        opacity: isLoading ? 0.2 : 1
                    }}
                >
                    {itemsBefore}

                    {filters?.map((filter, idx) => {
                        // Render the appropriate component for the refinement type, fallback to checkboxes
                        const Values = componentMap[filter.attributeId] || CheckboxRefinements
                        let selectedFiltersArray = selectedFilters?.[filter.attributeId] ?? []

                        // Catch any non-array values and wrap them in an array
                        if (!Array.isArray(selectedFiltersArray)) {
                            selectedFiltersArray = [selectedFiltersArray]
                        }

                        if (filter.values) {
                            return (
                                <Accordion.Item
                                    key={filter.attributeId}
                                    value={String(idx)}
                                    paddingTop={idx !== 0 || itemsBefore ? 6 : 0}
                                    borderBottom={idx === filters.length - 1 ? '1px solid' : 'none'}
                                    borderBottomColor="gray.200"
                                    paddingBottom={6}
                                    borderTop={idx === 0 && !itemsBefore ? 'none' : '1px solid'}
                                    borderTopColor="gray.200"
                                >
                                    <Accordion.ItemTrigger
                                        paddingTop={0}
                                        paddingBottom={2}
                                        cursor="pointer"
                                    >
                                        <Heading
                                            as="h2"
                                            flex="1"
                                            textAlign="left"
                                            fontSize="md"
                                            fontWeight={600}
                                        >
                                            {filter.label}
                                        </Heading>
                                        <Accordion.ItemIndicator />
                                    </Accordion.ItemTrigger>
                                    <Accordion.ItemContent paddingLeft={0}>
                                        <Values
                                            selectedFilters={selectedFiltersArray}
                                            filter={filter}
                                            toggleFilter={toggleFilter}
                                        />
                                    </Accordion.ItemContent>
                                </Accordion.Item>
                            )
                        } else {
                            return null
                        }
                    })}
                </Accordion.Root>
            )}
        </Stack>
    )
}

Refinements.propTypes = {
    itemsBefore: PropTypes.arrayOf(PropTypes.element),
    filters: PropTypes.array,
    excludedFilters: PropTypes.arrayOf(PropTypes.string),
    toggleFilter: PropTypes.func,
    selectedFilters: PropTypes.object,
    isLoading: PropTypes.bool
}

export default Refinements
