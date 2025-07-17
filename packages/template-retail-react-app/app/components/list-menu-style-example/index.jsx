/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Box, Text, VStack, Badge} from '@salesforce/retail-react-app/app/components/shared/ui'
import listMenuStyles from '@salesforce/retail-react-app/app/theme/foundations/list-menu-styles'

/**
 * Example component demonstrating how to use centralized ListMenu styles
 */
const ListMenuStyleExample = () => {
    // Direct import - no hooks needed for static styles

    return (
        <Box p={6}>
            <VStack spacing={4} align="start">
                <Text fontSize="lg" fontWeight="bold">
                    ListMenu Style Examples
                </Text>
                
                <Box>
                    <Text fontSize="md" fontWeight="semibold" mb={2}>
                        Primary Navigation Styles:
                    </Text>
                    <VStack spacing={2} align="start">
                        <Text {...listMenuStyles.primary.default}>
                            Default: {listMenuStyles.primary.default.color} | {listMenuStyles.primary.default.fontSize} | {listMenuStyles.primary.default.fontWeight}
                        </Text>
                        <Text {...listMenuStyles.primary.hover}>
                            Hover: {listMenuStyles.primary.hover.color} | {listMenuStyles.primary.hover.fontSize} | {listMenuStyles.primary.hover.fontWeight}
                        </Text>
                        <Text {...listMenuStyles.primary.active}>
                            Active: {listMenuStyles.primary.active.color} | {listMenuStyles.primary.active.fontSize} | {listMenuStyles.primary.active.fontWeight}
                        </Text>
                    </VStack>
                </Box>
                
                <Box>
                    <Text fontSize="md" fontWeight="semibold" mb={2}>
                        Dropdown Styles:
                    </Text>
                    <VStack spacing={2} align="start">
                        <Text {...listMenuStyles.dropdown.text}>
                            Text: {listMenuStyles.dropdown.text.color} | {listMenuStyles.dropdown.text.fontSize} | {listMenuStyles.dropdown.text.fontWeight}
                        </Text>
                        <Badge colorScheme="gray" bg={listMenuStyles.dropdown.background}>
                            Background: {listMenuStyles.dropdown.background}
                        </Badge>
                    </VStack>
                </Box>
                
                <Box>
                    <Text fontSize="md" fontWeight="semibold" mb={2}>
                        Using Direct Import:
                    </Text>
                    <Text {...listMenuStyles.primary.default}>
                        Primary Style: {listMenuStyles.primary.default.color} | {listMenuStyles.primary.default.fontSize} | {listMenuStyles.primary.default.fontWeight}
                    </Text>
                    <Text {...listMenuStyles.dropdown.text}>
                        Dropdown Text Style: {listMenuStyles.dropdown.text.color} | {listMenuStyles.dropdown.text.fontSize} | {listMenuStyles.dropdown.text.fontWeight}
                    </Text>
                </Box>
            </VStack>
        </Box>
    )
}

export default ListMenuStyleExample 