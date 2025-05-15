/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'

// Components
import {
    Box,
    IconButton,

    // Hooks
    useSlotRecipe
} from '@chakra-ui/react'

// Icons
import {
    SocialFacebookIcon,
    SocialInstagramIcon,
    SocialPinterestIcon,
    SocialTwitterIcon,
    SocialYoutubeIcon
} from '../icons'

/**
 *
 */
const SocialIcons = ({variant, pinterestInnerColor = 'white', ...otherProps}) => {
    const recipe = useSlotRecipe({key: 'socialIcons'})
    const styles = recipe({variant})
    return (
        <Box
            className="sf-social-icons"
            css={{...styles.container, '--pinterest-icon-inner': pinterestInnerColor}}
            {...otherProps}
        >
            {/* Social Links */}
            {[
                {
                    href: 'https://www.youtube.com/channel/UCSTGHqzR1Q9yAVbiS3dAFHg',
                    icon: SocialYoutubeIcon,
                    ariaLabel: 'YouTube'
                },
                {
                    href: 'https://www.instagram.com/commercecloud/?hl=en',
                    icon: SocialInstagramIcon,
                    ariaLabel: 'Instagram'
                },
                {
                    href: '/',
                    icon: SocialPinterestIcon,
                    ariaLabel: 'Pinterest'
                },
                {
                    href: 'https://twitter.com/CommerceCloud',
                    icon: SocialTwitterIcon,
                    ariaLabel: 'Twitter'
                },
                {
                    href: 'https://www.facebook.com/CommerceCloud/',
                    icon: SocialFacebookIcon,
                    ariaLabel: 'Facebook'
                }
            ].map(({href, icon: Icon, ariaLabel}) => (
                <IconButton
                    css={styles.item}
                    key={href}
                    variant="unstyled"
                    onClick={() => {
                        window.open(href)
                    }}
                    aria-label={ariaLabel}
                >
                    <Icon css={styles.icon} />
                </IconButton>
            ))}
        </Box>
    )
}

SocialIcons.displayName = 'SocialIcons'

SocialIcons.propTypes = {
    /**
     * This component has 3 variants, 'flex', 'flex-start' and 'flex-end'.
     * All will affect how the child icons are displayed. By default, it's
     * value is `flex`.
     */
    variant: PropTypes.string,

    /**
     * The inverse color of Pinterest icon's `currentColor`. For example, if the pinterest icon is white, then its inner 'p' is black.
     */
    pinterestInnerColor: PropTypes.string
}

export default SocialIcons
