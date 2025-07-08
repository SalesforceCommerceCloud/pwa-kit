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
 * SkipNavLink component - provides a skip link for keyboard navigation
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
                    width: 'auto !important',
                    height: 'auto !important',
                    padding: '8px !important',
                    backgroundColor: 'white !important',
                    color: 'black !important',
                    textDecoration: 'none !important',
                    border: '2px solid black !important',
                    borderRadius: '4px !important',
                    fontSize: '14px !important',
                    fontWeight: 'bold !important',
                    outline: 'none !important',
                    boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1) !important',
                    whiteSpace: 'nowrap !important',
                    overflow: 'visible !important',
                    zIndex: 9999
                }
            }}
            {...props}
        >
            {children}
        </Link>
    )
}

/**
 * SkipNavContent component - provides the target content area for skip navigation
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
