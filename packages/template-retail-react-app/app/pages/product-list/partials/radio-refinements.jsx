/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {
    Box,
    Text,
    Radio,
    RadioGroup,
    Stack
} from '@salesforce/retail-react-app/app/components/shared/ui'
import PropTypes from 'prop-types'

const RadioRefinements = ({filter, toggleFilter, selectedFilters}) => {
    return (
        <Box>
            <RadioGroup
                // The following `false` fallback is required to avoid the radio group
                // from switching to "uncontrolled mode" when `selectedFilters` is empty.
                value={selectedFilters[0] ?? false}
            >
                <Stack spacing={1}>
                    {filter.values
                        .filter((refinementValue) => refinementValue.hitCount > 0)
                        .map((value) => {
                            return (
                                <Box key={value.value}>
                                    <Radio
                                        display="flex"
                                        alignItems="center"
                                        height={{base: '44px', lg: '24px'}}
                                        value={value.value}
                                        onChange={() =>
                                            toggleFilter(
                                                value,
                                                filter.attributeId,
                                                selectedFilters.includes(value.value),
                                                false
                                            )
                                        }
                                        fontSize="sm"
                                    >
                                        <Text marginLeft={-1} fontSize="sm">
                                            {value.label}
                                        </Text>
                                    </Radio>
                                </Box>
                            )
                        })}
                </Stack>
            </RadioGroup>
        </Box>
    )
}

RadioRefinements.propTypes = {
    filter: PropTypes.object,
    toggleFilter: PropTypes.func,
    selectedFilters: PropTypes.array
}

export default RadioRefinements
