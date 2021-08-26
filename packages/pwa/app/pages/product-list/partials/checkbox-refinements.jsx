/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

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
