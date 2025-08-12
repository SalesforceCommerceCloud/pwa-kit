/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Link as ChakraLink} from '@chakra-ui/react'
import {Link as SPALink, NavLink as NavSPALink} from 'react-router-dom'
import {useMultiSite} from '../../hooks/use-multi-site'

const Link = React.forwardRef(({href, to, useNavLink = false, css, children, ...props}, ref) => {
    const _href = to || href
    const {buildUrl} = useMultiSite()
    const updatedHref = buildUrl(_href)

    const isActive = useNavLink
        ? (_, location) => {
              return location.pathname.endsWith(_href)
          }
        : undefined

    return (
        <ChakraLink asChild {...props} css={css} ref={ref}>
            {useNavLink ? (
                <NavSPALink to={updatedHref} isActive={isActive}>
                    {children}
                </NavSPALink>
            ) : (
                <SPALink to={updatedHref}>{children}</SPALink>
            )}
        </ChakraLink>
    )
})

Link.displayName = 'Link'

Link.propTypes = {
    href: PropTypes.string,
    to: PropTypes.string,
    useNavLink: PropTypes.bool,
    children: PropTypes.node,
    css: PropTypes.oneOfType([PropTypes.object, PropTypes.func, PropTypes.array, PropTypes.string])
}

export default React.memo(Link)
