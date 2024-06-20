/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {
    Box,
    SimpleGrid,
    HStack,
    Text,
    Button,
    Center,
    useMultiStyleConfig
} from '@salesforce/retail-react-app/app/components/shared/ui'
import PropTypes from 'prop-types'
import {cssColorGroups} from '@salesforce/retail-react-app/app/constants'
import {useIntl} from 'react-intl'
import {
    ADD_FILTER_HIT_COUNT,
    REMOVE_FILTER_HIT_COUNT
} from '@salesforce/retail-react-app/app/pages/product-list/partials/refinements-utils'

const ColorRefinements = ({filter, toggleFilter, selectedFilters}) => {
    const intl = useIntl()
    const styles = useMultiStyleConfig('SwatchGroup', {
        variant: 'circle',
        disabled: false
    })

    return (
        <SimpleGrid columns={2} spacing={2} mt={1}>
            {filter.values.map((value, idx) => {
                const isSelected = selectedFilters.includes(value.value)

                // Don't display refinements with no results, unless we got there by selecting too
                // many refinements
                if (value.hitCount === 0 && !isSelected) return

                return (
                    <Box key={idx}>
                        <HStack
                            onClick={() => toggleFilter(value, filter.attributeId, isSelected)}
                            spacing={1}
                            cursor="pointer"
                        >
                            <Button
                                {...styles.swatch}
                                color={isSelected ? 'black' : 'gray.200'}
                                border={isSelected ? '1px' : '0'}
                                aria-checked={isSelected}
                                variant="outline"
                                marginRight={0}
                                marginBottom="-1px"
                                aria-label={intl.formatMessage(
                                    isSelected ? REMOVE_FILTER_HIT_COUNT : ADD_FILTER_HIT_COUNT,
                                    value
                                )}
                            >
                                <Center
                                    {...styles.swatchButton}
                                    marginRight={0}
                                    border="1px solid black"
                                >
                                    <Box
                                        marginRight={0}
                                        height="100%"
                                        width="100%"
                                        minWidth="32px"
                                        backgroundRepeat="no-repeat"
                                        backgroundSize="cover"
                                        backgroundColor={
                                            cssColorGroups[value.presentationId.toLowerCase()]
                                        }
                                        background={
                                            value.presentationId.toLowerCase() ===
                                                'miscellaneous' &&
                                            cssColorGroups[value.presentationId.toLowerCase()]
                                        }
                                    />
                                </Center>
                            </Button>
                            <Text
                                display="flex"
                                alignItems="center"
                                fontSize="sm"
                                marginBottom="1px"
                                aria-hidden="true" // avoid redundant readout since swatch has aria label
                            >
                                {intl.formatMessage(
                                    {
                                        id: 'colorRefinements.label.hitCount',
                                        defaultMessage: '{colorLabel} ({colorHitCount})'
                                    },
                                    {colorLabel: value.label, colorHitCount: value.hitCount}
                                )}
                            </Text>
                        </HStack>
                    </Box>
                )
            })}
        </SimpleGrid>
    )
}

ColorRefinements.propTypes = {
    filter: PropTypes.object,
    toggleFilter: PropTypes.func,
    selectedFilters: PropTypes.array
}

export default ColorRefinements
