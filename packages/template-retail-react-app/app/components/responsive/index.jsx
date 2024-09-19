/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'

/**
 * Render the children in the DOM but visually hide them on desktop
 * @param children - isomorphic components used within a responsive design
 * @param rest - additional props to be passed to the Box component
 */
export const HideOnDesktop = ({children, ...rest}) => (
    <Box display={{base: 'block', lg: 'none'}} {...rest}>
        {children}
    </Box>
)
HideOnDesktop.propTypes = {
    children: PropTypes.node
}

/**
 * Render the children in the DOM but visually hide them on mobile
 * @param children - isomorphic components used within a responsive design
 * @param rest - additional props to be passed to the Box component
 */
export const HideOnMobile = ({children, ...rest}) => (
    <Box display={{base: 'none', lg: 'block'}} {...rest}>
        {children}
    </Box>
)
HideOnMobile.propTypes = {
    children: PropTypes.node
}

export default {HideOnMobile, HideOnDesktop}
