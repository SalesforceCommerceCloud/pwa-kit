/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
import React from 'react'
import {Box, Checkbox, Stack} from '@chakra-ui/react'
import PropTypes from 'prop-types'

const CheckboxRefinements = ({filter, toggleFilter, selectedFilters}) => {
    return (
        <Stack spacing={1}>
            {filter.values
                ?.filter((refinementValue) => refinementValue.hitCount > 0)
                .map((value) => {
                    return (
                        <Box key={value.value}>
                            <Checkbox
                                isChecked={!!selectedFilters}
                                onChange={() =>
                                    toggleFilter(
                                        value,
                                        filter.attributeId,
                                        !!selectedFilters,
                                        false
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
