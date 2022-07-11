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
import {getPathWithUrlConfig} from '../../utils/url'
import {useSite} from '../../hooks/use-site'
import {useLocale} from '../../hooks/use-locale'
import {useAppConfigUrl} from '../../hooks/use-app-config-url'

const Link = React.forwardRef(({href, to, useNavLink = false, ...props}, ref) => {
    const _href = to || href
    const site = useSite()
    const locale = useLocale()
    const appConfigUrl = useAppConfigUrl()

    console.log('Link locale:', locale)
    console.log('Link site:', site)
    console.log('Link _href:', _href)

    const pathWithUrlConfig = getPathWithUrlConfig(
        _href,
        locale.locale.alias || locale.locale.id,
        site.site.alias || site.site.id,
        appConfigUrl
    )

    console.log('Link pathWithUrlConfig:', pathWithUrlConfig)

    return (
        <ChakraLink
            as={useNavLink ? NavSPALink : SPALink}
            {...(useNavLink && {exact: true})}
            {...props}
            to={_href === '/' ? '/' : pathWithUrlConfig}
            ref={ref}
        />
    )
})

Link.displayName = 'Link'

Link.propTypes = {href: PropTypes.string, to: PropTypes.string, useNavLink: PropTypes.bool}

export default React.memo(Link)
