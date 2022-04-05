/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {
    Text,
    Stack,
    Divider,
    Accordion,
    AccordionItem,
    AccordionButton,
    AccordionPanel,
    AccordionIcon
} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import ColorRefinements from './color-refinements'
import SizeRefinements from './size-refinements'
import RadioRefinements from './radio-refinements'
import CheckboxRefinements from './checkbox-refinements'
import LinkRefinements from './link-refinements'
import {isServer} from '../../../utils/utils'
import {FILTER_ACCORDION_SATE} from '../../../constants'

const componentMap = {
    cgid: LinkRefinements,
    c_refinementColor: ColorRefinements,
    c_size: SizeRefinements,
    price: RadioRefinements
}

const Refinements = ({filters, toggleFilter, selectedFilters, isLoading}) => {
    // Getting the indices of filters to open accordions by default
    let filtersIndexes = filters?.map((filter, idx) => idx)

    // Use saved state for accordions
    if (!isServer) {
        const savedExpandedAccordionIndexes =
            window.localStorage.getItem(FILTER_ACCORDION_SATE) &&
            JSON.parse(window.localStorage.getItem(FILTER_ACCORDION_SATE))

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

    // Handle saving acccordion state
    const updateAccordionState = (expandedIndex) => {
        const filterState = filters
            ?.filter((filter, index) => expandedIndex.includes(index))
            .map((filter) => filter.attributeId)
        window.localStorage.setItem(FILTER_ACCORDION_SATE, JSON.stringify(filterState))
    }

    return (
        <Stack spacing={8}>
            {/* Wait to have filters before rendering the Accordion to allow the deafult indexes to be accurate */}
            {filtersIndexes && (
                <Accordion
                    pointerEvents={isLoading ? 'none' : 'auto'}
                    onChange={updateAccordionState}
                    opacity={isLoading ? 0.2 : 1}
                    allowMultiple={true}
                    allowToggle={true}
                    defaultIndex={filtersIndexes}
                    reduceMotion={true}
                >
                    {filters?.map((filter, idx) => {
                        // Render the appropriate component for the refinement type, fallback to checkboxes
                        const Values = componentMap[filter.attributeId] || CheckboxRefinements
                        const selectedFiltersArray = selectedFilters?.[filter.attributeId]
                        if (filter.values) {
                            return (
                                <Stack key={filter.attributeId} divider={<Divider />}>
                                    <AccordionItem
                                        paddingTop={idx !== 0 ? 6 : 0}
                                        borderBottom={
                                            idx === filters.length - 1
                                                ? '1px solid gray.200'
                                                : 'none'
                                        }
                                        paddingBottom={6}
                                        borderTop={idx === 0 && 'none'}
                                    >
                                        {({isExpanded}) => (
                                            <>
                                                <AccordionButton
                                                    paddingTop={0}
                                                    paddingBottom={isExpanded ? 2 : 0}
                                                >
                                                    <Text
                                                        flex="1"
                                                        textAlign="left"
                                                        fontSize="md"
                                                        fontWeight={600}
                                                    >
                                                        {filter.label}
                                                    </Text>
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
    filters: PropTypes.array,
    toggleFilter: PropTypes.func,
    selectedFilters: PropTypes.object,
    isLoading: PropTypes.bool
}

export default Refinements
