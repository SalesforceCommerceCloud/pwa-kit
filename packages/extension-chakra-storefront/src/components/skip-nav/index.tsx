/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Box, Link} from '@chakra-ui/react'

interface SkipNavLinkProps {
    children: React.ReactNode
    zIndex?: string | number
    href?: string
}

interface SkipNavContentProps {
    children: React.ReactNode
    style?: React.CSSProperties
    id?: string
}

/**
 * SkipNavLink component provides a skip link for keyboard navigation
 * with initial state screen reader accessible but visually hidden
 */
export const SkipNavLink: React.FC<SkipNavLinkProps> = ({
    children,
    zIndex = 'skipLink',
    href = '#skip-to-content',
    ...props
}) => {
    return (
        <Link
            href={href}
            position="absolute"
            zIndex={zIndex}
            css={{
                position: 'absolute',
                left: '-10000px',
                top: 'auto',
                width: '1px',
                height: '1px',
                overflow: 'hidden',
                '&:focus, &:focus-visible': {
                    position: 'fixed !important',
                    top: '6px !important',
                    left: '6px !important',
                    zIndex: 9999,
                    width: 'auto !important',
                    height: 'auto !important',
                    overflow: 'visible !important',
                    padding: '8px',
                    backgroundColor: 'white',
                    color: 'black',
                    textDecoration: 'none',
                    border: '2px solid black',
                    borderRadius: '4px',
                    fontSize: '14px',
                    fontWeight: 'bold',
                    outline: 'none',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
                    whiteSpace: 'nowrap'
                }
            }}
            {...props}
        >
            {children}
        </Link>
    )
}

/**
 * SkipNavContent component provides the target content area for skip navigation
 */
export const SkipNavContent: React.FC<SkipNavContentProps> = ({
    children,
    style,
    id = 'skip-to-content',
    ...props
}) => {
    return (
        <Box id={id} style={style} tabIndex={-1} {...props}>
            {children}
        </Box>
    )
}
