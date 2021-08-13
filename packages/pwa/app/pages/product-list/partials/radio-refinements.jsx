/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * *
 * Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. *
 * * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React, {useEffect} from 'react'
import {Box, Text, Radio, RadioGroup, Stack} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import useRefinementToggle from '../../../commerce-api/hooks/useRefinementToggle'

const RadioRefinements = ({filter, toggleFilter, selectedFilters}) => {
    const {applyUIFeedback, selectedRefinements, setSelectedRefinements} = useRefinementToggle()

    useEffect(() => {
        if (!selectedRefinements && selectedFilters) {
            console.log(selectedRefinements)
            setSelectedRefinements(selectedFilters)
        } else if (selectedRefinements && !selectedFilters) {
            setSelectedRefinements(undefined)
        }
    }, [selectedFilters])

    const applyUIFeedbackAndToggle = (value, attributeId, selected) => {
        applyUIFeedback(value, selected)
        toggleFilter(value, attributeId, selected)
    }

    console.log(selectedRefinements && selectedRefinements[0])
    return (
        <Box>
            {/* <HStack marginBottom={2}>
                <InputGroup>
                    <InputLeftElement
                        pointerEvents="none"
                        color="gray.300"
                        fontSize="1.2em"
                        children="$"
                    />
                    <Input placeholder="Min" />
                </InputGroup>
                <Center>
                    <Text>to</Text>
                </Center>
                <InputGroup>
                    <InputLeftElement
                        pointerEvents="none"
                        color="gray.300"
                        fontSize="1.2em"
                        children="$"
                    />
                    <Input placeholder="Max" />
                </InputGroup>
                <IconButton icon={<ChevronRightIcon />} variant="unstyled" />
            </HStack> */}
            <RadioGroup value={selectedRefinements && selectedRefinements[0]}>
                <Stack spacing={1}>
                    {filter.values
                        .filter((refinementValue) => refinementValue.hitCount > 0)
                        .map((value) => {
                            console.log(value.value)
                            return (
                                <Box key={value.value}>
                                    <Radio
                                        display="flex"
                                        alignItems="center"
                                        height={{base: '44px', lg: '24px'}}
                                        value={value.value}
                                        onChange={() =>
                                            applyUIFeedbackAndToggle(
                                                value,
                                                filter.attributeId,
                                                selectedFilters?.includes(value.value)
                                            )
                                        }
                                        fontSize="sm"
                                    >
                                        <Text marginLeft={-1} fontSize="sm">
                                            {value.label}
                                        </Text>
                                    </Radio>
                                </Box>
                            )
                        })}
                </Stack>
            </RadioGroup>
        </Box>
    )
}

RadioRefinements.propTypes = {
    filter: PropTypes.object,
    toggleFilter: PropTypes.func,
    selectedFilters: PropTypes.array
}

export default RadioRefinements
