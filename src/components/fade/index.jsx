/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import {Box} from '@chakra-ui/react'
import PropTypes from 'prop-types'

/**
 * A simple fade-in/fade-out component using Chakra UI's Box and native CSS transitions.
 * This version delays enabling the transition until after the initial mount to ensure
 * that the fade-in effect is visually applied (i.e., avoids starting at full opacity).
 *
 * @component
 *
 * @param {Object} props - Component props.
 * @param {boolean} props.in - Controls the visibility of the component.
 * When `true`, the content fades in; when `false`, it fades out.
 * @param {React.ReactNode} props.children - The content to render inside the box.
 * @param {Object} [props.rest] - Any additional props are passed to the Chakra Box component.
 *
 * @example
 * <Fade in={isOpen}>
 *   <Box>This will fade in and out</Box>
 * </Fade>
 *
 * @note
 * The fade-in animation is delayed until after the component mounts,
 * preventing it from appearing instantly at full opacity.
 */
const Fade = ({in: isVisible, children, ...rest}) => {
    const [isMounted, setIsMounted] = useState(false)

    useEffect(() => {
        setIsMounted(true)
    }, [])
    console.log('isVisible: ', isVisible)
    console.log('isMounted: ', isMounted)
    console.log('isVisible && isMounted: ', isVisible && isMounted)
    console.log('opacity: ', isVisible && isMounted ? 1 : 0)
    return (
        <Box
            opacity={isVisible && isMounted ? 1 : 0}
            transition="opacity 0.2s ease-in-out"
            pointerEvents={isVisible ? 'auto' : 'none'}
            {...rest}
        >
            {children}
        </Box>
    )
}

Fade.displayName = 'Fade'

Fade.propTypes = {
    /**
     * Fade child elements
     */
    children: PropTypes.node,
    /**
     * Whether the component is visible.
     */
    in: PropTypes.bool
}

export default Fade
