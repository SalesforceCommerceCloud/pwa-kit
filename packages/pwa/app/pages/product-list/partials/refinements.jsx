/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

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

const componentMap = {
    cgid: LinkRefinements,
    c_refinementColor: ColorRefinements,
    c_size: SizeRefinements,
    price: RadioRefinements
}

const Refinements = ({filters, toggleFilter, selectedFilters, isLoading}) => {
    // Getting the indices of filters to open accordions by default
    let filtersIndexes = filters?.map((filter, idx) => idx)
    return (
        <Stack spacing={8}>
            {/* Wait to have filters before rendering the Accordion to allow the deafult indexes to be accurate */}
            {filtersIndexes && (
                <Accordion
                    opacity={isLoading ? 0.2 : 1}
                    allowMultiple={true}
                    allowToggle={true}
                    defaultIndex={filtersIndexes}
                    reduceMotion={true}
                >
                    {filters?.map((filter, idx) => {
                        // Render the appropriate component for the refinement type, fallback to checkboxes
                        const Values = componentMap[filter.attributeId] || CheckboxRefinements
                        const selectedFiltersArray = selectedFilters?.[filter.attributeId]?.split(
                            '|'
                        )
                        if (filter.values) {
                            return (
                                <Stack key={filter.attributeId} divider={<Divider />}>
                                    <AccordionItem
                                        paddingTop={idx !== 0 ? 6 : 0}
                                        borderBottom="none"
                                        borderTop={idx === 0 && 'none'}
                                    >
                                        <AccordionButton paddingTop={0}>
                                            <Text
                                                flex="1"
                                                textAlign="left"
                                                fontSize="sm"
                                                fontWeight="bold"
                                            >
                                                {filter.label}
                                            </Text>
                                            <AccordionIcon />
                                        </AccordionButton>
                                        <AccordionPanel paddingLeft={0} paddingBottom={6}>
                                            <Values
                                                selectedFilters={selectedFiltersArray}
                                                filter={filter}
                                                toggleFilter={toggleFilter}
                                            />
                                        </AccordionPanel>
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
