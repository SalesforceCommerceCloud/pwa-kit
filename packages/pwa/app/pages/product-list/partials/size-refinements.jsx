/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {SimpleGrid, Button, Center, useMultiStyleConfig} from '@chakra-ui/react'
import PropTypes from 'prop-types'

const SizeRefinements = ({filter, toggleFilter, selectedFilters}) => {
    const styles = useMultiStyleConfig('SwatchGroup', {
        variant: 'square',
        disabled: false
    })
    return (
        <SimpleGrid templateColumns="repeat(auto-fit, 40px)" spacing={2} mt={1}>
            {filter.values
                ?.filter((refinementValue) => refinementValue.hitCount > 0)
                .map((value, idx) => {
                    return (
                        <Button
                            key={idx}
                            {...styles.swatch}
                            borderColor={
                                selectedFilters?.includes(value.value) ? 'black' : 'gray.200'
                            }
                            backgroundColor={
                                selectedFilters?.includes(value.value) ? 'black' : 'white'
                            }
                            color={selectedFilters?.includes(value.value) ? 'white' : 'gray.900'}
                            onClick={() =>
                                toggleFilter(
                                    value,
                                    filter.attributeId,
                                    selectedFilters?.includes(value.value)
                                )
                            }
                            aria-checked={selectedFilters?.includes(value.value)}
                            variant="outline"
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
    categoryId: PropTypes.string
}

export default SizeRefinements
