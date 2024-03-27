/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Heading,
    Stack,
    Text,
    Container
} from '@salesforce/retail-react-app/app/components/shared/ui'

/**
 * Section component used on content pages like home page.
 * This component helps with creating a consistent layout and
 * consistent typography styles for section headings.
 */
const Section = ({title, subtitle, actions, maxWidth, children, ...props}) => {
    const sectionMaxWidth = maxWidth || '3xl'
    return (
        <Box as={'section'} paddingBottom="16" {...props}>
            <Stack spacing={4} as={Container} maxW={sectionMaxWidth} textAlign={'center'}>
                {title && (
                    <Heading as="h2" fontSize={40} textAlign="center">
                        {title}
                    </Heading>
                )}
                {subtitle && (
                    <Text color={'gray.700'} fontWeight={600}>
                        {subtitle}
                    </Text>
                )}
                {actions && (
                    <Box paddingTop="2" width={{base: 'full', md: 'auto'}}>
                        {actions}
                    </Box>
                )}
            </Stack>
            {children}
        </Box>
    )
}

Section.displayName = 'Section'

Section.propTypes = {
    /**
     * Section component main title
     */
    title: PropTypes.string,
    /**
     * Section component subtitle
     */
    subtitle: PropTypes.oneOfType([PropTypes.array, PropTypes.string, PropTypes.node]),
    /**
     * Section children node(s)
     */
    children: PropTypes.node,
    /**
     * Call to action component(s)
     */
    actions: PropTypes.element,
    /**
     * Section maximum width
     */
    maxWidth: PropTypes.string
}

export default Section
