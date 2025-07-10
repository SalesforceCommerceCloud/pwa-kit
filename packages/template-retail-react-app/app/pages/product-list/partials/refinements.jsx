/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useMemo, useRef} from 'react'
import {
    Heading,
    Stack,
    Divider,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon
} from '@salesforce/retail-react-app/app/components/shared/ui'
import PropTypes from 'prop-types'
import ColorRefinements from '@salesforce/retail-react-app/app/pages/product-list/partials/color-refinements'
import SizeRefinements from '@salesforce/retail-react-app/app/pages/product-list/partials/size-refinements'
import RadioRefinements from '@salesforce/retail-react-app/app/pages/product-list/partials/radio-refinements'
import CheckboxRefinements from '@salesforce/retail-react-app/app/pages/product-list/partials/checkbox-refinements'
import LinkRefinements from '@salesforce/retail-react-app/app/pages/product-list/partials/link-refinements'
import {isServer} from '@salesforce/retail-react-app/app/utils/utils'
import {FILTER_ACCORDION_SATE} from '@salesforce/retail-react-app/app/constants'

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
    // Memoize filter IDs to prevent unnecessary re-renders
    const prevFilterIdsRef = useRef('')
    const {effectiveFilters, effectiveFilterIdsString} = useMemo(() => {
        const hasExcludes = Array.isArray(excludedFilters) && excludedFilters.length > 0
        const [effectiveFilters, effectiveFilterIds] = (
            Array.isArray(filters) ? filters : []
        ).reduce(
            (acc, filter) => {
                const {attributeId} = filter
                // Exclude filters in the exclude list
                if (!hasExcludes || !excludedFilters.includes(attributeId)) {
                    acc[0].push(filter)
                    acc[1].push(attributeId)
                }
                return acc
            },
            [[], []]
        )
        const effectiveFilterIdsString = effectiveFilterIds.join(',')
        if (effectiveFilterIdsString !== prevFilterIdsRef.current) {
            prevFilterIdsRef.current = effectiveFilterIdsString
        }
        return {
            effectiveFilters,
            effectiveFilterIds,
            effectiveFilterIdsString
        }
    }, [filters])

    // Getting the indices of filters to open accordions by default
    const effectiveFilterIndexes = useMemo(() => {
        if (!isServer) {
            // Use saved state for accordions
            // TODO: Change this to `useLocalStorage` hook when localStorage detection is more robust
            const filterAccordionState = window.localStorage?.getItem?.(FILTER_ACCORDION_SATE)
            const savedExpandedAccordionIndexes =
                filterAccordionState && JSON.parse(filterAccordionState)
            if (
                Array.isArray(savedExpandedAccordionIndexes) &&
                savedExpandedAccordionIndexes.length
            ) {
                return effectiveFilters.reduce((acc, filter, idx) => {
                    savedExpandedAccordionIndexes.includes(filter.attributeId) && acc.push(idx)
                    return acc
                }, [])
            }
        }

        // On the server or in case of no saved state in the `localStorage`, simply return
        // all effective filter indexes
        return effectiveFilters.map((_, idx) => idx)
    }, [effectiveFilterIdsString])

    // Handle saving accordion state
    const updateAccordionState = (expandedIndexes) => {
        const filterState = effectiveFilters
            .filter((filter, index) => expandedIndexes.includes(index))
            .map((filter) => filter.attributeId)

        // TODO: Update when localStorage detection is more robust? useLocalStorage is only a getter
        window.localStorage?.setItem?.(FILTER_ACCORDION_SATE, JSON.stringify(filterState))
    }

    return (
        <Stack spacing={8}>
            {/* Wait to have filters before rendering the Accordion to allow the default indexes to be accurate */}
            {effectiveFilterIndexes && (
                <Accordion
                    pointerEvents={isLoading ? 'none' : 'auto'}
                    onChange={updateAccordionState}
                    opacity={isLoading ? 0.2 : 1}
                    allowMultiple={true}
                    defaultIndex={effectiveFilterIndexes}
                    reduceMotion={true}
                >
                    {itemsBefore}

                    {effectiveFilters?.map((filter, idx) => {
                        // Render the appropriate component for the refinement type, fallback to checkboxes
                        const Values = componentMap[filter.attributeId] || CheckboxRefinements
                        let selectedFiltersArray = selectedFilters?.[filter.attributeId] ?? []

                        // Catch any non-array values and wrap them in an array
                        if (!Array.isArray(selectedFiltersArray)) {
                            selectedFiltersArray = [selectedFiltersArray]
                        }

                        if (filter.values) {
                            return (
                                <Stack key={filter.attributeId} divider={<Divider />}>
                                    <AccordionItem
                                        paddingTop={idx !== 0 || itemsBefore ? 6 : 0}
                                        borderBottom={
                                            idx === effectiveFilters.length - 1
                                                ? '1px solid gray.200'
                                                : 'none'
                                        }
                                        paddingBottom={6}
                                        borderTop={
                                            idx === 0 && !itemsBefore
                                                ? 'none'
                                                : '1px solid gray.200'
                                        }
                                    >
                                        {({isExpanded}) => (
                                            <>
                                                <AccordionButton
                                                    paddingTop={0}
                                                    paddingBottom={isExpanded ? 2 : 0}
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
                                                    <AccordionIcon />
                                                </AccordionButton>
                                                <AccordionPanel paddingLeft={0}>
                                                    <Values
                                                        selectedFilters={selectedFiltersArray}
                                                        filter={filter}
                                                        toggleFilter={toggleFilter}
                                                    />
                                                </AccordionPanel>
                                            </>
                                        )}
                                    </AccordionItem>
                                </Stack>
                            )
                        } else {
                            return null
                        }
                    })}
                </Accordion>
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
