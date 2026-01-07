/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef} from 'react'
import PropTypes from 'prop-types'
import {FormattedMessage} from 'react-intl'
import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'
import {
    Box,
    Flex,
    Text,
    IconButton,
    Spinner,
    Stack,
    Spacer
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {CloseIcon, LocationIcon} from '@salesforce/retail-react-app/app/components/icons'

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
        >
            <Flex px={4} pr={0} py={2} alignItems="center">
                <Text fontSize="sm" fontWeight="medium" color="gray.600">
                    <FormattedMessage
                        defaultMessage="SUGGESTED"
                        id="addressSuggestionDropdown.suggested"
                    />
                </Text>
                <Spacer />
                <IconButton
                    size="sm"
                    variant="ghost"
                    icon={<CloseIcon boxSize={4} color="gray.600" />}
                    onClick={onClose}
                    aria-label="Close suggestions"
                />
            </Flex>
            <Stack spacing={0}>
                {suggestions.map((suggestion, index) => (
                    <Box
                        key={index}
                        px={4}
                        py={3}
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
                            <LocationIcon boxSize={4} color="black" />
                            <Box flex={1}>
                                <Text fontSize="sm" noOfLines={1}>
                                    {suggestion.description ||
                                        `${suggestion.structured_formatting?.main_text}, ${suggestion.structured_formatting?.secondary_text}`}
                                </Text>
                            </Box>
                        </Flex>
                    </Box>
                ))}
            </Stack>

            <Box px={4} py={3} display="flex" alignItems="center">
                <img
                    src={getAssetUrl('static/img/GoogleMaps_Logo_Gray_4x.png')}
                    alt="Google Maps"
                    style={{width: '98px', height: '18px'}}
                />
            </Box>
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
            types: PropTypes.arrayOf(PropTypes.string),
            placePrediction: PropTypes.object
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
