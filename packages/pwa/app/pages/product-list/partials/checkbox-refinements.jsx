/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React, {useEffect} from 'react'
import {Box, Checkbox, Stack} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import useRefinementToggle from '../../../commerce-api/hooks/useRefinementToggle'

const CheckboxRefinements = ({filter, toggleFilter, selectedFilters}) => {
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
        <Stack spacing={1}>
            {filter.values
                ?.filter((refinementValue) => refinementValue.hitCount > 0)
                .map((value) => {
                    return (
                        <Box key={value.value}>
                            <Checkbox
                                isChecked={selectedRefinements?.includes(value.value)}
                                onChange={() =>
                                    applyUIFeedbackAndToggle(
                                        value,
                                        filter.attributeId,
                                        selectedFilters?.includes(value.value)
                                    )
                                }
                            >
                                {value.label}
                            </Checkbox>
                        </Box>
                    )
                })}
        </Stack>
    )
}

CheckboxRefinements.propTypes = {
    filter: PropTypes.object,
    toggleFilter: PropTypes.func,
    selectedFilters: PropTypes.array
}

export default CheckboxRefinements
