/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Box} from '@chakra-ui/react'

/**
 * Render the children in the DOM but visually hide them on desktop
 * @param children - isomorphic components used within a responsive design
 * @param styles - addition styles for the component
 */
export const HideOnDesktop = ({children, ...styles}) => {
    return (
        <Box display={{base: 'block', lg: 'none'}} {...styles}>
            {children}
        </Box>
    )
}
HideOnDesktop.propTypes = {children: PropTypes.node, styles: PropTypes.object}

/**
 * Render the children in the DOM but visually hide them on mobile
 * @param children - isomorphic components used within a responsive design
 * @param styles - addition styles for the component
 */
export const HideOnMobile = ({children, ...styles}) => {
    return (
        <Box display={{base: 'none', lg: 'block'}} {...styles}>
            {children}
        </Box>
    )
}
HideOnMobile.propTypes = {children: PropTypes.node, styles: PropTypes.object}

export default {HideOnMobile, HideOnDesktop}
