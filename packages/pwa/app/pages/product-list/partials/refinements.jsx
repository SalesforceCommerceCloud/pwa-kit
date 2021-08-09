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

const componentMap = {
    c_refinementColor: ColorRefinements,
    c_size: SizeRefinements,
    price: RadioRefinements
}

const Refinements = ({filters, toggleFilter, selectedFilters}) => {
    const filtersIndexes = filters?.map((filter, idx) => idx)
    return (
        <Stack spacing={8}>
            <Accordion
                allowMultiple={true}
                allowToggle={true}
                defaultIndex={filtersIndexes}
                reduceMotion={true}
            >
                {filters?.map((filter, idx) => {
                    // Render the appropriate component for the refinement type, fallback to checkboxes
                    const Values = componentMap[filter.attributeId] || CheckboxRefinements
                    const selectedFiltersArray = selectedFilters?.[filter.attributeId]?.split('|')
                    if (filter.values) {
                        return (
                            <Stack key={filter.attributeId} divider={<Divider />}>
                                {/* {filtersLoading && <LoadingSpinner />} */}
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
        </Stack>
    )
}

Refinements.propTypes = {
    filters: PropTypes.array,
    toggleFilter: PropTypes.func,
    selectedFilters: PropTypes.object
}

export default Refinements
