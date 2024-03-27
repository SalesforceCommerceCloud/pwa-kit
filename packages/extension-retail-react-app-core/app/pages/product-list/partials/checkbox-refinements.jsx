/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {Box, Checkbox, Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    ADD_FILTER,
    REMOVE_FILTER
} from '@salesforce/retail-react-app/app/pages/product-list/partials/refinements-utils'

const CheckboxRefinements = ({filter, toggleFilter, selectedFilters}) => {
    const {formatMessage} = useIntl()
    return (
        <Stack spacing={1}>
            {filter.values?.map((value) => {
                const isChecked = selectedFilters.includes(value.value)
                // Don't display refinements with no results, unless we got there by selecting too
                // many refinements
                if (value.hitCount === 0 && !isChecked) return

                return (
                    <Box key={value.value}>
                        <Checkbox
                            isChecked={isChecked}
                            onChange={() => toggleFilter(value, filter.attributeId, isChecked)}
                            aria-label={formatMessage(
                                isChecked ? REMOVE_FILTER : ADD_FILTER,
                                value
                            )}
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
