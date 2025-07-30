/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Box, SimpleGrid, HStack, Text, Button, Center, useSlotRecipe} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {
    ADD_FILTER_HIT_COUNT,
    REMOVE_FILTER_HIT_COUNT
} from '../../../pages/product-list/partials/refinements-utils'

const ColorRefinements = ({filter, toggleFilter, selectedFilters}) => {
    const {formatMessage} = useIntl()
    const recipe = useSlotRecipe({
        key: 'swatchGroup',
        variant: 'circle'
    })

    return (
        <SimpleGrid columns={2} gap={2} mt={1}>
            {filter.values.map((value, idx) => {
                const isSelected = selectedFilters.includes(value.value)

                // Don't display refinements with no results, unless we got there by selecting too
                // many refinements
                if (value.hitCount === 0 && !isSelected) return

                const styles = recipe({variant: 'circle', selected: isSelected})

                const messages = {
                    colotHitariaLabel: formatMessage(
                        isSelected ? REMOVE_FILTER_HIT_COUNT : ADD_FILTER_HIT_COUNT,
                        value
                    ),
                    colorHitCount: formatMessage(
                        {
                            id: 'colorRefinements.label.hitCount',
                            defaultMessage: '{colorLabel} ({colorHitCount})'
                        },
                        {colorLabel: value.label, colorHitCount: value.hitCount}
                    )
                }

                return (
                    <Box key={idx}>
                        <HStack gap={1} cursor="pointer">
                            <Button
                                css={styles.swatch}
                                aria-label={messages.colotHitariaLabel}
                                aria-checked={isSelected}
                                data-state={isSelected ? 'selected' : undefined}
                                variant="outline"
                                role="checkbox"
                                tabIndex={0}
                                marginRight={0}
                                marginBottom={0}
                                onClick={(e) => {
                                    e.preventDefault()
                                    toggleFilter(value, filter.attributeId, isSelected)
                                }}
                            >
                                <Center
                                    css={styles.swatchButton}
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
                                        backgroundColor={`cssColorGroups.${value.presentationId?.toLowerCase()}`}
                                        background={
                                            value.presentationId?.toLowerCase() === 'miscellaneous'
                                                ? `cssColorGroups.${value.presentationId?.toLowerCase()}`
                                                : undefined
                                        }
                                    />
                                </Center>
                            </Button>
                            <Text
                                display="flex"
                                alignItems="center"
                                fontSize="sm"
                                marginBottom="1px"
                                onClick={() => toggleFilter(value, filter.attributeId, isSelected)}
                                cursor="pointer"
                                aria-hidden="true" // avoid redundant readout since swatch has aria label
                            >
                                {messages.colorHitCount}
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
