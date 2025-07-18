/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {FormattedMessage, useIntl} from 'react-intl'
import PropTypes from 'prop-types'
import {Box, Button, Flex} from '@chakra-ui/react'
import {CloseIcon} from '../../../components/icons'
import {REMOVE_FILTER} from './refinements-utils'

const SelectedRefinements = ({toggleFilter, selectedFilterValues, filters, handleReset}) => {
    const {formatMessage} = useIntl()
    const priceFilterValues = filters?.find((filter) => filter.attributeId === 'price')

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
        <Flex
            direction="row"
            align="center"
            wrap="wrap"
            gap={2}
            data-testid="sf-selected-refinements"
        >
            {selectedFilters?.map((filter, idx) => {
                return (
                    <Box key={idx} marginLeft={0} marginRight={1}>
                        <Button
                            marginTop={1}
                            padding={5}
                            color="black"
                            colorPalette="gray"
                            size="sm"
                            backgroundColor="gray.100"
                            _hover={{
                                backgroundColor: 'gray.200'
                            }}
                            onClick={() =>
                                toggleFilter({value: filter.apiLabel}, filter.value, true)
                            }
                            aria-label={formatMessage(REMOVE_FILTER, {label: filter.uiLabel})}
                        >
                            {filter.uiLabel}
                            <CloseIcon color="black" boxSize={4} ml={2} mr="-7px" mb="-6px" />
                        </Button>
                    </Box>
                )
            })}

            {selectedFilters?.length > 0 && (
                <Box>
                    <Button
                        padding={{sm: 0, base: 2}}
                        variant="plain"
                        size="sm"
                        onClick={handleReset}
                        aria-label={formatMessage({
                            id: 'selected_refinements.action.assistive_msg.clear_all',
                            defaultMessage: 'Clear all filters'
                        })}
                    >
                        <FormattedMessage
                            defaultMessage="Clear All"
                            id="selected_refinements.action.clear_all"
                        />
                    </Button>
                </Box>
            )}
        </Flex>
    )
}

SelectedRefinements.propTypes = {
    filters: PropTypes.array,
    selectedFilterValues: PropTypes.object,
    toggleFilter: PropTypes.func,
    handleReset: PropTypes.func
}

export default SelectedRefinements
