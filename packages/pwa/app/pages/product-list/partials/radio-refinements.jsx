/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {Box, Text, Radio, RadioGroup, Stack} from '@chakra-ui/react'
import PropTypes from 'prop-types'

const RadioRefinements = ({filter, toggleFilter, selectedFilters}) => {
    return (
        <RadioGroup defaultValue={selectedFilters && selectedFilters[0]}>
            <Stack spacing={1}>
                {filter.values
                    .filter((refinementValue) => refinementValue.hitCount > 0)
                    .map((value) => {
                        return (
                            <Box key={value.value}>
                                <Radio
                                    value={value.value}
                                    onChange={() =>
                                        toggleFilter(
                                            value,
                                            filter.attributeId,
                                            selectedFilters?.includes(value.value)
                                        )
                                    }
                                    fontSize="sm"
                                >
                                    <Text fontSize="sm">{value.label}</Text>
                                </Radio>
                            </Box>
                        )
                    })}
            </Stack>
        </RadioGroup>
    )
}

RadioRefinements.propTypes = {
    filter: PropTypes.object,
    toggleFilter: PropTypes.func,
    selectedFilters: PropTypes.array
}

export default RadioRefinements
