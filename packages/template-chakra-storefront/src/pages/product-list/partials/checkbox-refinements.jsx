/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Box, Checkbox, Stack} from '@chakra-ui/react'
import {ADD_FILTER, REMOVE_FILTER} from './refinements-utils'

const CheckboxRefinements = ({filter, toggleFilter, selectedFilters}) => {
    const {formatMessage} = useIntl()
    return (
        <Stack gap={1}>
            {filter.values?.map((value) => {
                const isChecked = selectedFilters.includes(value.value)
                // Don't display refinements with no results, unless we got there by selecting too
                // many refinements
                if (value.hitCount === 0 && !isChecked) return

                return (
                    <Box key={value.value}>
                        <Checkbox.Root
                            checked={isChecked}
                            onCheckedChange={() =>
                                toggleFilter(value, filter.attributeId, isChecked)
                            }
                            aria-label={formatMessage(
                                isChecked ? REMOVE_FILTER : ADD_FILTER,
                                value
                            )}
                        >
                            <Checkbox.HiddenInput />
                            <Checkbox.Control>
                                <Checkbox.Indicator />
                            </Checkbox.Control>
                            <Checkbox.Label>{value.label}</Checkbox.Label>
                        </Checkbox.Root>
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
