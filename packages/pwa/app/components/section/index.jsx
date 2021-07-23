/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */
/* Copyright (c) 2021 Mobify Research & Development Inc. All rights reserved. */
/* * *  *  * *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  *  * */

import React from 'react'
import PropTypes from 'prop-types'
import {Box, Heading} from '@chakra-ui/react'

/**
 * Section component used on content pages like home page.
 * This component helps with creating a consistent layout and
 * consistent typography styles for section headings.
 */
const Section = ({title, children, ...props}) => {
    return (
        <Box paddingBottom="16" {...props}>
            <Heading as="h2" fontSize="xl" textAlign="center" marginBottom="8">
                {title}
            </Heading>
            {children}
        </Box>
    )
}

Section.displayName = 'Section'

Section.propTypes = {
    title: PropTypes.string,
    children: PropTypes.node
}

export default Section
