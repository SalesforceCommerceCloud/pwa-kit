/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Box, Checkbox, Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import PropTypes from 'prop-types'

const CheckboxRefinements = ({filter, toggleFilter, selectedFilters}) => {
    return (
        <Stack spacing={1}>
            {filter.values
                ?.filter((refinementValue) => refinementValue.hitCount > 0)
                .map((value) => {
                    const isChecked = selectedFilters.includes(value.value)

                    return (
                        <Box key={value.value}>
                            <Checkbox
                                isChecked={isChecked}
                                onChange={() => toggleFilter(value, filter.attributeId, isChecked)}
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
