/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useIntl} from 'react-intl'
import {
    Box,
    Button,
    Badge,
    HStack,
    Text,
    Fade
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useComparison} from '@salesforce/retail-react-app/app/hooks'
import Link from '@salesforce/retail-react-app/app/components/link'

/**
 * ComparisonBadge is a floating badge that shows the number of products being compared
 * and allows quick access to the comparison page
 */
const ComparisonBadge = () => {
    const intl = useIntl()
    const {comparedProducts, openDrawer} = useComparison()

    if (comparedProducts.length === 0) {
        return null
    }

    return (
        <Fade in={true}>
            <Box
                position="fixed"
                bottom="4"
                right="4"
                zIndex="1000"
                bg="blue.500"
                color="white"
                borderRadius="full"
                shadow="lg"
                px={4}
                py={2}
                cursor="pointer"
                onClick={openDrawer}
                _hover={{
                    bg: 'blue.600',
                    transform: 'scale(1.05)'
                }}
                transition="all 0.2s"
            >
                <HStack spacing={2}>
                    <Text fontSize="sm" fontWeight="medium">
                        {intl.formatMessage({
                            id: 'comparison_badge.compare',
                            defaultMessage: 'Compare'
                        })}
                    </Text>
                    <Badge colorScheme="white" color="blue.500" variant="solid">
                        {comparedProducts.length}
                    </Badge>
                </HStack>
            </Box>
        </Fade>
    )
}

export default ComparisonBadge
