/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {
    SimpleGrid,
    Button,
    Center,
    useMultiStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    ADD_FILTER,
    REMOVE_FILTER
} from '@salesforce/retail-react-app/app/pages/product-list/partials/refinements-utils'

const SizeRefinements = ({filter, toggleFilter, selectedFilters}) => {
    const {formatMessage} = useIntl()
    const styles = useMultiStyleConfig('SwatchGroup', {
        variant: 'square',
        disabled: false
    })

    return (
        <SimpleGrid templateColumns="repeat(auto-fit, 44px)" spacing={4} mt={1}>
            {filter.values?.map((value, idx) => {
                // Note the loose comparison, for "string == number" checks.
                const isSelected = selectedFilters.some((filterValue) => filterValue == value.value)
                // Don't display refinements with no results, unless we got there by selecting too
                // many refinements
                if (value.hitCount === 0 && !isSelected) return

                return (
                    <Button
                        key={idx}
                        {...styles.swatch}
                        borderColor={isSelected ? 'black' : 'gray.200'}
                        backgroundColor={isSelected ? 'black' : 'white'}
                        color={isSelected ? 'white' : 'gray.900'}
                        onClick={() => toggleFilter(value, filter.attributeId, isSelected)}
                        aria-checked={isSelected}
                        variant="outline"
                        marginBottom={0}
                        marginRight={0}
                        aria-label={formatMessage(isSelected ? REMOVE_FILTER : ADD_FILTER, value)}
                    >
                        <Center {...styles.swatchButton}>{value.label}</Center>
                    </Button>
                )
            })}
        </SimpleGrid>
    )
}

SizeRefinements.propTypes = {
    filter: PropTypes.object,
    selectedFilters: PropTypes.oneOfType([PropTypes.arrayOf(PropTypes.string), PropTypes.string]),
    toggleFilter: PropTypes.func
}

export default SizeRefinements
