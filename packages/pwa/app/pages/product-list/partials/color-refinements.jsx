/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useEffect} from 'react'
import {Box, SimpleGrid, HStack, Text, Button, Center, useMultiStyleConfig} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import {cssColorGroups} from '../../../constants'
import useRefinementToggle from '../../../commerce-api/hooks/useRefinementToggle'

const ColorRefinements = ({filter, toggleFilter, selectedFilters}) => {
    const styles = useMultiStyleConfig('SwatchGroup', {
        variant: 'circle',
        disabled: false
    })

    const {applyUIFeedback, selectedRefinements, setSelectedRefinements} = useRefinementToggle()

    useEffect(() => {
        if (!selectedRefinements && selectedFilters) {
            setSelectedRefinements(selectedFilters)
        } else if (selectedRefinements && !selectedFilters) {
            setSelectedRefinements(undefined)
        }
    }, [selectedFilters])

    const applyUIFeedbackAndToggle = (value, attributeId, selected) => {
        applyUIFeedback(value, selected)
        toggleFilter(value, attributeId, selected)
    }

    return (
        <SimpleGrid columns={2} spacing={2} mt={1}>
            {filter.values
                .filter((refinementValue) => refinementValue.hitCount > 0)
                .map((value, idx) => {
                    return (
                        <Box key={idx}>
                            <HStack
                                onClick={() =>
                                    applyUIFeedbackAndToggle(
                                        value,
                                        filter.attributeId,
                                        selectedRefinements?.includes(value.value)
                                    )
                                }
                                spacing={1}
                                cursor="pointer"
                            >
                                <Button
                                    {...styles.swatch}
                                    color={
                                        selectedRefinements?.includes(value.value)
                                            ? 'black'
                                            : 'gray.200'
                                    }
                                    border={
                                        selectedRefinements?.includes(value.value) ? '1px' : '0'
                                    }
                                    aria-checked={selectedRefinements?.includes(value.value)}
                                    variant="outline"
                                    marginRight={0}
                                    marginBottom={0}
                                >
                                    <Center
                                        {...styles.swatchButton}
                                        marginRight={0}
                                        border={
                                            value.label.toLowerCase() === 'white' &&
                                            '1px solid black'
                                        }
                                    >
                                        <Box
                                            marginRight={0}
                                            height="100%"
                                            width="100%"
                                            minWidth="32px"
                                            backgroundRepeat="no-repeat"
                                            backgroundSize="cover"
                                            backgroundColor={
                                                cssColorGroups[value.value.toLowerCase()]
                                            }
                                            background={
                                                value.value.toLowerCase() === 'miscellaneous' &&
                                                cssColorGroups[value.value.toLowerCase()]
                                            }
                                        />
                                    </Center>
                                </Button>
                                <Text
                                    display="flex"
                                    alignItems="center"
                                    fontSize="sm"
                                >{`${value.label} (${value.hitCount})`}</Text>
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
