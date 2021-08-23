/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {SimpleGrid, Button, Center, useMultiStyleConfig} from '@chakra-ui/react'
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
                    const selected = Array.isArray(selectedFilters)
                        ? selectedFilters?.includes(value.value)
                        : selectedFilters === value.value

                    return (
                        <Button
                            key={idx}
                            {...styles.swatch}
                            borderColor={selected ? 'black' : 'gray.200'}
                            backgroundColor={selected ? 'black' : 'white'}
                            color={selected ? 'white' : 'gray.900'}
                            onClick={() => toggleFilter(value, filter.attributeId, selected)}
                            aria-checked={selectedFilters == value.value}
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
    selectedFilterValues: PropTypes.object,
    categoryId: PropTypes.string,
    selectedFilters: PropTypes.array,
    toggleFilter: PropTypes.func
}

export default SizeRefinements
