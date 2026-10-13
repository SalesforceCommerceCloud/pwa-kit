/*
 * Copyright (c) 2026, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {
    Box,
    Skeleton,
    Text,
    Link as ChakraLink
} from '@salesforce/retail-react-app/app/components/shared/ui'
import Link from '@salesforce/retail-react-app/app/components/link'
import {isAbsoluteURL} from '@salesforce/retail-react-app/app/page-designer/utils'

const HEIGHT_STYLE = {
    sm: {py: 1.5, fontSize: 'xs'},
    md: {py: 3, fontSize: 'sm'},
    lg: {py: 5, fontSize: 'md'}
}

const ALIGNMENT_JUSTIFY = {
    left: 'flex-start',
    center: 'center',
    right: 'flex-end'
}

const COLOR_SCHEME_STYLE = {
    primary: {bg: 'blue.600', color: 'white'},
    secondary: {bg: 'gray.100', color: 'gray.800'},
    destructive: {bg: 'red.600', color: 'white'}
}

const normalize = (value, allowed, fallback) => (allowed.includes(value) ? value : fallback)

/**
 * Announcement Banner component.
 *
 * A banner for announcements, promotions, and alerts. Rendered as an authorable
 * content block; typically placed in the embedded header's `announcement` region.
 *
 * @param {object} props
 * @param {string} props.message - The announcement text (required; renders nothing when empty).
 * @param {string} [props.linkUrl] - Optional link target. Rendered only with linkText.
 * @param {string} [props.linkText] - Optional link label. Rendered only with linkUrl.
 * @param {string} [props.colorScheme] - primary | secondary | destructive (default primary).
 * @param {string} [props.height] - sm | md | lg (default md).
 * @param {string} [props.alignment] - left | center | right (default center).
 * @returns {React.ReactElement|null} - AnnouncementBanner component.
 */
export const AnnouncementBanner = ({
    message,
    linkUrl,
    linkText,
    colorScheme,
    height,
    alignment
}) => {
    if (!message) return null

    const heightStyle = HEIGHT_STYLE[normalize(height, ['sm', 'md', 'lg'], 'md')]
    const resolvedAlignment = normalize(alignment, ['left', 'center', 'right'], 'center')
    const colorStyle =
        COLOR_SCHEME_STYLE[
            normalize(colorScheme, ['primary', 'secondary', 'destructive'], 'primary')
        ]

    const isAbsolute = isAbsoluteURL(linkUrl)
    const LinkWrapper = isAbsolute ? ChakraLink : Link
    const linkProps = isAbsolute ? {href: linkUrl} : {to: linkUrl}

    return (
        <Box
            role="status"
            className={'announcement-banner'}
            data-testid={'announcement-banner'}
            display="flex"
            alignItems="center"
            gap={2}
            px={{base: 4, md: 10}}
            letterSpacing="wide"
            justifyContent={ALIGNMENT_JUSTIFY[resolvedAlignment]}
            {...heightStyle}
            {...colorStyle}
        >
            <Text textAlign={resolvedAlignment} margin={0}>
                {message}
                {linkUrl && linkText && (
                    <>
                        {' '}
                        <LinkWrapper
                            {...linkProps}
                            textDecoration="underline"
                            fontWeight="medium"
                            whiteSpace="nowrap"
                            color="inherit"
                        >
                            {linkText}
                        </LinkWrapper>
                    </>
                )}
            </Text>
        </Box>
    )
}

AnnouncementBanner.propTypes = {
    message: PropTypes.string,
    linkUrl: PropTypes.string,
    linkText: PropTypes.string,
    colorScheme: PropTypes.string,
    height: PropTypes.string,
    alignment: PropTypes.string
}

AnnouncementBanner.displayName = 'AnnouncementBanner'

/**
 * Suspense fallback for the Announcement Banner. Mirrors the default md/center/primary
 * height so switching from fallback to real content does not shift layout.
 *
 * @returns {React.ReactElement} - Skeleton placeholder.
 */
export function AnnouncementBannerFallback() {
    return (
        <Box
            aria-hidden="true"
            display="flex"
            alignItems="center"
            justifyContent="center"
            px={{base: 4, md: 10}}
            py={3}
            bg="blue.600"
        >
            <Skeleton height="16px" width="192px" />
        </Box>
    )
}

AnnouncementBannerFallback.displayName = 'AnnouncementBannerFallback'

export default AnnouncementBanner

// The V2 registry reads a module's named `fallback` export to render during the
// client Suspense boundary while the component chunk loads.
export {AnnouncementBannerFallback as fallback}
