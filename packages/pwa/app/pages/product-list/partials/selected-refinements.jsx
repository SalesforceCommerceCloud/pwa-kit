/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import {Box, Stack, Button} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import {cssColorGroups} from '../../../constants'
import useNavigation from '../../../hooks/use-navigation'
import {CloseIcon} from '../../../components/icons'

import {FormattedMessage} from 'react-intl'

const SelectedRefinements = ({toggleFilter, selectedFilterValues, categoryId, filters}) => {
    const priceFilterValues = filters?.find((filter) => filter.attributeId === 'price')
    const navigate = useNavigation()
    const resetFilters = () => {
        selectedFilters = []
        navigate(window.location.pathname)
    }

    let selectedFilters = []
    for (const key in selectedFilterValues) {
        const filters = selectedFilterValues[key].split('|')
        filters?.forEach((filter) => {
            const selected = {
                label:
                    key === 'price'
                        ? priceFilterValues?.values?.find(
                              (priceFilter) => priceFilter.value === filter
                          )?.label
                        : filter,
                value: key
            }

            if (selected.value !== 'htype' && selected.label !== categoryId) {
                selectedFilters.push(selected)
            }
        })
    }

    return (
        <Stack direction="row" align="center" display="flex" flexWrap="wrap">
            {selectedFilters?.map((filter) => {
                return (
                    <Box key={filter.value} marginLeft={0} marginRight={1}>
                        <Button
                            marginTop={1}
                            padding={5}
                            // backgroundColor="gray.50"
                            color="black"
                            colorScheme="gray"
                            // colorScheme="gray.50"
                            size="sm"
                            iconSpacing={1}
                            rightIcon={<CloseIcon color="black" boxSize={4} mr="-7px" mb="-6px" />}
                            onClick={() => toggleFilter(filter.label, filter.value, true)}
                        >
                            {filter.label}
                        </Button>
                    </Box>
                )
            })}

            {selectedFilters?.length > 0 && (
                <Box>
                    <Button
                        padding={{sm: 0, base: 2}}
                        variant="link"
                        size="sm"
                        onClick={resetFilters}
                    >
                        <FormattedMessage defaultMessage="Clear All" />
                    </Button>
                </Box>
            )}
        </Stack>
    )
}

SelectedRefinements.propTypes = {
    filters: PropTypes.array,
    selectedFilterValues: PropTypes.object,
    categoryId: PropTypes.string
}

export default SelectedRefinements
