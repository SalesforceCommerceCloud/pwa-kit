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
import useMultiSite from '../../hooks/use-multi-site'

const Link = React.forwardRef(({href, to, useNavLink = false, ...props}, ref) => {
    const _href = to || href
    const {buildUrl} = useMultiSite()
    const updatedHref = buildUrl(_href)
    return (
        <ChakraLink
            as={useNavLink ? NavSPALink : SPALink}
            {...(useNavLink && {exact: true})}
            {...props}
            to={updatedHref}
            ref={ref}
        />
    )
})

Link.displayName = 'Link'

Link.propTypes = {href: PropTypes.string, to: PropTypes.string, useNavLink: PropTypes.bool}

export default React.memo(Link)
