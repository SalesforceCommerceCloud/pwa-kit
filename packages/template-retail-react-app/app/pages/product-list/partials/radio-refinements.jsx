/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useRef} from 'react'
import {Box, Text, Radio, Stack} from '@salesforce/retail-react-app/app/components/shared/ui'
import PropTypes from 'prop-types'

const RadioRefinement = ({filter, value, toggleFilter, selectedFilters}) => {
    const buttonRef = useRef()
    // Because choosing a refinement is equivalent to a form submission, the best semantic choice
    // for the refinement is a button or a link, rather than a radio input. The radio element here
    // is purely for visual purposes, and should probably be replaced with a simple icon.
    return (
        <Box>
            <Radio
                display="inline-flex"
                height={{base: '44px', lg: '24px'}}
                isChecked={selectedFilters.includes(value.value)}
                // Ideally, this "icon" would be part of the button, but doing so with a radio input
                // triggers `onClick` twice. The radio must be separate, and therefore we must add
                // these workarounds to prevent it from receiving focus.
                inputProps={{'aria-hidden': true, tabIndex: -1}}
                onClick={() => buttonRef.current?.click()}
            />
            <Text
                ref={buttonRef}
                ml={2}
                as="button"
                fontSize="sm"
                onClick={() => toggleFilter(value, filter.attributeId, false, false)}
            >
                {value.label}
            </Text>
        </Box>
    )
}

RadioRefinement.propTypes = {
    filter: PropTypes.object,
    value: PropTypes.object,
    toggleFilter: PropTypes.func,
    selectedFilters: PropTypes.arrayOf(PropTypes.object)
}

const RadioRefinements = ({filter, toggleFilter, selectedFilters}) => {
    return (
        <Stack spacing={1}>
            {filter.values.map(
                (value) =>
                    value.hitCount > 0 && (
                        <RadioRefinement
                            key={value.value}
                            value={value}
                            filter={filter}
                            toggleFilter={toggleFilter}
                            selectedFilters={selectedFilters}
                        />
                    )
            )}
        </Stack>
    )
}

RadioRefinements.propTypes = {
    filter: PropTypes.object,
    toggleFilter: PropTypes.func,
    selectedFilters: PropTypes.arrayOf(PropTypes.object)
}

export default RadioRefinements
