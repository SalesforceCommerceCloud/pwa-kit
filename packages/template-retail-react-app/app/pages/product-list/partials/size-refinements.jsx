/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {
    SimpleGrid,
    Button,
    Center,
    useMultiStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'
import PropTypes from 'prop-types'

const SizeRefinements = ({filter, toggleFilter, selectedFilters}) => {
    const styles = useMultiStyleConfig('SwatchGroup', {
        variant: 'square',
        disabled: false
    })

    return (
        <SimpleGrid templateColumns="repeat(auto-fit, 44px)" spacing={4} mt={1}>
            {filter.values
                ?.filter((refinementValue) => refinementValue.hitCount > 0)
                .map((value, idx) => {
                    // Note the loose comparison, for "string == number" checks.
                    const isSelected = selectedFilters.some(
                        (filterValue) => filterValue == value.value
                    )

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
