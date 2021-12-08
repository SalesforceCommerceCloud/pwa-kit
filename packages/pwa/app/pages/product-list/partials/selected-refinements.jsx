/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Box, Button, Wrap, WrapItem} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import useNavigation from '../../../hooks/use-navigation'
import {CloseIcon} from '../../../components/icons'

import {FormattedMessage} from 'react-intl'
import {useParams} from 'react-router-dom'

const SelectedRefinements = ({toggleFilter, selectedFilterValues, filters}) => {
    const priceFilterValues = filters?.find((filter) => filter.attributeId === 'price')
    const navigate = useNavigation()
    const params = useParams()
    const resetFilters = () => {
        selectedFilters = []
        navigate(`/category/${params.categoryId}`)
    }

    let selectedFilters = []
    for (const key in selectedFilterValues) {
        const filters = selectedFilterValues[key].split('|')
        filters?.forEach((filter) => {
            const selected = {
                uiLabel:
                    key === 'price'
                        ? priceFilterValues?.values?.find(
                              (priceFilter) => priceFilter.value === filter
                          )?.label
                        : filter,
                value: key,
                apiLabel: filter
            }

            if (selected.value !== 'htype' && selected.value !== 'cgid') {
                selectedFilters.push(selected)
            }
        })
    }

    return (
        <Wrap
            direction="row"
            align="center"
            display="flex"
            flexWrap="wrap"
            data-testid="sf-selected-refinements"
        >
            {selectedFilters?.map((filter, idx) => {
                return (
                    <WrapItem key={idx}>
                        <Box marginLeft={0} marginRight={1}>
                            <Button
                                marginTop={1}
                                padding={5}
                                color="black"
                                colorScheme="gray"
                                size="sm"
                                iconSpacing={1}
                                rightIcon={
                                    <CloseIcon color="black" boxSize={4} mr="-7px" mb="-6px" />
                                }
                                onClick={() =>
                                    toggleFilter({value: filter.apiLabel}, filter.value, true)
                                }
                            >
                                {filter.uiLabel}
                            </Button>
                        </Box>
                    </WrapItem>
                )
            })}

            {selectedFilters?.length > 0 && (
                <WrapItem>
                    <Box>
                        <Button
                            padding={{sm: 0, base: 2}}
                            variant="link"
                            size="sm"
                            onClick={resetFilters}
                        >
                            <FormattedMessage
                                defaultMessage="Clear All"
                                id="selected_refinements.action.clear_all"
                            />
                        </Button>
                    </Box>
                </WrapItem>
            )}
        </Wrap>
    )
}

SelectedRefinements.propTypes = {
    filters: PropTypes.array,
    selectedFilterValues: PropTypes.object,
    toggleFilter: PropTypes.func
}

export default SelectedRefinements
