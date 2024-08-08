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
 * @param display - custom display property for the base and lg breakpoints
 */
export const HideOnDesktop = ({children, display = {base: 'block', lg: 'none'}}) => (
    <Box display={display}>{children}</Box>
)
HideOnDesktop.propTypes = {
    children: PropTypes.node,
    display: PropTypes.object
}

/**
 * Render the children in the DOM but visually hide them on mobile
 * @param children - isomorphic components used within a responsive design
 * @param display - custom display property for the base and lg breakpoints
 */
export const HideOnMobile = ({children, display = {base: 'none', lg: 'block'}}) => (
    <Box display={display}>{children}</Box>
)
HideOnMobile.propTypes = {
    children: PropTypes.node,
    display: PropTypes.object
}

export default {HideOnMobile, HideOnDesktop}
