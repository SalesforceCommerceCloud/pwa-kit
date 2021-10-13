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
import {useIntl} from 'react-intl'
import {homeUrlBuilder} from '../../utils/url'
import {useSiteAlias} from '../../hooks/use-site-alias'

const Link = React.forwardRef(({href, to, useNavLink = false, ...props}, ref) => {
    const _href = to || href
    const {locale} = useIntl()
    const siteAlias = useSiteAlias()
    const basePath = `/${siteAlias}/${locale}`
    const localizedHref = _href && _href.includes(basePath) ? _href : `${basePath}${_href}`

    return (
        <ChakraLink
            as={useNavLink ? NavSPALink : SPALink}
            {...(useNavLink && {exact: true})}
            {...props}
            to={_href === '/' ? homeUrlBuilder('/', locale, siteAlias) : localizedHref}
            ref={ref}
        />
    )
})

Link.displayName = 'Link'

Link.propTypes = {href: PropTypes.string, to: PropTypes.string, useNavLink: PropTypes.bool}

export default React.memo(Link)
