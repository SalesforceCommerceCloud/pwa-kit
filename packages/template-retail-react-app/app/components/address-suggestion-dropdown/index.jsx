/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef} from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Flex,
    Text,
    IconButton,
    VStack,
    HStack,
    Spinner
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {CloseIcon} from '@salesforce/retail-react-app/app/components/icons'

/**
 * Address Suggestion Dropdown Component
 * Displays Google-powered address suggestions in a dropdown format
 */
const AddressSuggestionDropdown = ({
    suggestions = [],
    isLoading = false,
    onClose,
    onSelectSuggestion,
    isVisible = false,
    position = 'absolute'
}) => {
    const dropdownRef = useRef(null)

    // Handle click outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                onClose()
            }
        }

        if (isVisible) {
            document.addEventListener('mousedown', handleClickOutside)
        }

        return () => {
            document.removeEventListener('mousedown', handleClickOutside)
        }
    }, [isVisible, onClose])

    if (!isVisible || suggestions.length === 0) {
        return null
    }

    if (isLoading) {
        return (
            <Box
                position="absolute"
                top="100%"
                left={0}
                right={0}
                bg="white"
                border="1px solid"
                borderColor="gray.200"
                borderRadius="md"
                boxShadow="md"
                zIndex={1000}
                p={4}
            >
                <Flex align="center" justify="center">
                    <Spinner size="sm" mr={2} />
                    <Text>Loading suggestions...</Text>
                </Flex>
            </Box>
        )
    }

    return (
        <Box
            ref={dropdownRef}
            data-testid="address-suggestion-dropdown"
            position={position}
            top="100%"
            left={0}
            right={0}
            zIndex={1000}
            bg="white"
            border="1px solid"
            borderColor="gray.200"
            borderRadius="md"
            boxShadow="md"
            mt={1}
            maxH="300px"
            overflowY="auto"
        >
            <Flex
                px={4}
                py={2}
                borderBottom="1px solid"
                borderColor="gray.200"
                justifyContent="space-between"
                alignItems="center"
            >
                <Text fontSize="sm" fontWeight="medium" color="gray.600">
                    Suggested
                </Text>
                <IconButton
                    aria-label="Close suggestions"
                    icon={<CloseIcon />}
                    variant="ghost"
                    size="sm"
                    onClick={onClose}
                />
            </Flex>
            {suggestions.map((suggestion, index) => (
                <Box
                    key={index}
                    px={4}
                    py={2}
                    cursor="pointer"
                    _hover={{bg: 'gray.50'}}
                    onClick={() => onSelectSuggestion(suggestion)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            onSelectSuggestion(suggestion)
                        }
                    }}
                >
                    <Flex alignItems="center" gap={2}>
                        {/* Location Marker */}
                        <Box position="relative" w={4} h={4}>
                            <Box
                                position="absolute"
                                top={0}
                                left={0}
                                w={4}
                                h={4}
                                bg="blue.500"
                                borderRadius="full"
                                opacity={0.2}
                            />
                            <Box
                                position="absolute"
                                top={1}
                                left={1}
                                w={2}
                                h={2}
                                bg="blue.500"
                                borderRadius="full"
                            />
                        </Box>

                        {/* Address Text */}
                        <Box flex={1}>
                            <Text fontSize="sm" noOfLines={1}>
                                {suggestion.structured_formatting.main_text}
                            </Text>
                            {suggestion.structured_formatting.secondary_text && (
                                <Text fontSize="xs" color="gray.500" noOfLines={1}>
                                    {suggestion.structured_formatting.secondary_text}
                                </Text>
                            )}
                        </Box>
                    </Flex>
                </Box>
            ))}
        </Box>
    )
}

AddressSuggestionDropdown.propTypes = {
    /** Array of address suggestions to display */
    suggestions: PropTypes.arrayOf(
        PropTypes.shape({
            description: PropTypes.string,
            place_id: PropTypes.string,
            structured_formatting: PropTypes.shape({
                main_text: PropTypes.string,
                secondary_text: PropTypes.string
            }),
            terms: PropTypes.arrayOf(
                PropTypes.shape({
                    offset: PropTypes.number,
                    value: PropTypes.string
                })
            ),
            types: PropTypes.arrayOf(PropTypes.string)
        })
    ),

    /** Whether the dropdown should be visible */
    isVisible: PropTypes.bool,

    /** Callback when close button is clicked */
    onClose: PropTypes.func.isRequired,

    /** Callback when a suggestion is selected */
    onSelectSuggestion: PropTypes.func.isRequired,

    /** CSS position property for the dropdown */
    position: PropTypes.oneOf(['absolute', 'relative', 'fixed']),

    /** Whether the dropdown is loading */
    isLoading: PropTypes.bool
}

export default AddressSuggestionDropdown
