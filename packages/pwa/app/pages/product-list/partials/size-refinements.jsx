/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useEffect} from 'react'
import {SimpleGrid, Button, Center, useMultiStyleConfig} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import useRefinementToggle from '../../../commerce-api/hooks/useRefinementToggle'

const SizeRefinements = ({filter, toggleFilter, selectedFilters}) => {
    const styles = useMultiStyleConfig('SwatchGroup', {
        variant: 'square',
        disabled: false
    })

    const {applyUIFeedback, selectedRefinements, setSelectedRefinements} = useRefinementToggle()

    useEffect(() => {
        if (!selectedRefinements && selectedFilters) {
            setSelectedRefinements(selectedFilters)
        } else if (selectedRefinements && !selectedFilters) {
            setSelectedRefinements(undefined)
        }
    }, [selectedFilters])

    const applyUIFeedbackAndToggle = (value, attributeId, selected) => {
        applyUIFeedback(value, selected)
        toggleFilter(value, attributeId, selected)
    }
    return (
        <SimpleGrid templateColumns="repeat(auto-fit, 40px)" spacing={2} mt={1}>
            {filter.values
                ?.filter((refinementValue) => refinementValue.hitCount > 0)
                .map((value, idx) => {
                    return (
                        <Button
                            key={idx}
                            {...styles.swatch}
                            borderColor={
                                selectedRefinements?.includes(value.value) ? 'black' : 'gray.200'
                            }
                            backgroundColor={
                                selectedRefinements?.includes(value.value) ? 'black' : 'white'
                            }
                            color={
                                selectedRefinements?.includes(value.value) ? 'white' : 'gray.900'
                            }
                            onClick={() =>
                                applyUIFeedbackAndToggle(
                                    value,
                                    filter.attributeId,
                                    selectedFilters?.includes(value.value)
                                )
                            }
                            aria-checked={selectedFilters?.includes(value.value)}
                            variant="outline"
                        >
                            <Center {...styles.swatchButton}>{value.label}</Center>
                        </Button>
                    )
                })}
        </SimpleGrid>
    )
}

SizeRefinements.propTypes = {
    filter: PropTypes.object,
    selectedFilterValues: PropTypes.object,
    categoryId: PropTypes.string,
    selectedFilters: PropTypes.array,
    toggleFilter: PropTypes.func
}

export default SizeRefinements
