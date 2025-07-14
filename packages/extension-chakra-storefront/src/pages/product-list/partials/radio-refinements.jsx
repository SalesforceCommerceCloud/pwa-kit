/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {RadioGroup, Stack} from '@chakra-ui/react'
import {ADD_FILTER, REMOVE_FILTER} from '../../../pages/product-list/partials/refinements-utils'

const RadioRefinement = ({value, isSelected}) => {
    const {formatMessage} = useIntl()
    // Because choosing a refinement is equivalent to a form submission, the best semantic choice
    // for the refinement is a button or a link, rather than a radio input. The radio element here
    // is purely for visual purposes, and should probably be replaced with a simple icon.
    return (
        <RadioGroup.Item
            value={value.value}
            display="inline-flex"
            height={{base: '44px', lg: '24px'}}
            alignItems="center"
            cursor="pointer"
        >
            <RadioGroup.ItemHiddenInput />
            <RadioGroup.ItemIndicator cursor="pointer" />
            <RadioGroup.ItemText
                fontSize="sm"
                aria-label={formatMessage(isSelected ? REMOVE_FILTER : ADD_FILTER, value)}
            >
                {value.label}
            </RadioGroup.ItemText>
        </RadioGroup.Item>
    )
}

RadioRefinement.propTypes = {
    filter: PropTypes.object,
    value: PropTypes.object,
    toggleFilter: PropTypes.func,
    isSelected: PropTypes.bool
}

const RadioRefinements = ({filter, toggleFilter, selectedFilters}) => {
    const selectedValue =
        selectedFilters.length > 0 ? selectedFilters[0]?.value || selectedFilters[0] : ''

    const handleValueChange = (details) => {
        const newValue = details.value
        const valueObject = filter.values.find((v) => v.value === newValue)

        if (valueObject) {
            const isCurrentlySelected = selectedFilters.some(
                (sf) => (typeof sf === 'string' ? sf : sf.value) === newValue
            )

            toggleFilter(valueObject, filter.attributeId, isCurrentlySelected, false)
        }
    }

    return (
        <RadioGroup.Root value={selectedValue} onValueChange={handleValueChange}>
            <Stack gap={1}>
                {filter.values.map((value) => {
                    const isSelected = selectedFilters.some(
                        (sf) => (typeof sf === 'string' ? sf : sf.value) === value.value
                    )

                    // Don't display refinements with no results, unless we got there by selecting too
                    // many refinements
                    if (value.hitCount === 0 && !isSelected) return null

                    return (
                        <RadioRefinement
                            key={value.value}
                            value={value}
                            filter={filter}
                            toggleFilter={toggleFilter}
                            isSelected={isSelected}
                        />
                    )
                })}
            </Stack>
        </RadioGroup.Root>
    )
}

RadioRefinements.propTypes = {
    filter: PropTypes.object,
    toggleFilter: PropTypes.func,
    selectedFilters: PropTypes.arrayOf(PropTypes.oneOfType([PropTypes.string, PropTypes.object]))
}

export default RadioRefinements
