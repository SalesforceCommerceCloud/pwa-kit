/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Box, Link, useSlotRecipe} from '@chakra-ui/react'

interface SkipNavLinkProps {
    children: React.ReactNode
    href?: string
}

interface SkipNavContentProps {
    children: React.ReactNode
    css?: any
    id?: string
}

/**
 * SkipNavLink component provides a skip link for keyboard navigation
 * with initial state screen reader accessible but visually hidden
 */
export const SkipNavLink: React.FC<SkipNavLinkProps> = ({
    children,
    href = '#skip-to-content',
    ...props
}) => {
    const recipe = useSlotRecipe({key: 'skipNav'})
    const styles = recipe()

    return (
        <Link href={href} css={styles.link} {...props}>
            {children}
        </Link>
    )
}

/**
 * SkipNavContent component provides the target content area for skip navigation
 */
export const SkipNavContent: React.FC<SkipNavContentProps> = ({
    children,
    css,
    id = 'skip-to-content',
    ...props
}) => {
    const recipe = useSlotRecipe({key: 'skipNav'})
    const styles = recipe()

    return (
        <Box id={id} css={[styles.content, css]} tabIndex={-1} {...props}>
            {children}
        </Box>
    )
}
