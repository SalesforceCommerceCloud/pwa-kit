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
import {buildPathWithUrlConfig} from '../../utils/url'
import useSite from '../../hooks/use-site'
import useLocale from '../../hooks/use-locale'
import SDKLink from 'pwa-kit-react-sdk/ssr/universal/components/link'

const Link = React.forwardRef(({href, to, useNavLink = false, ...props}, ref) => {
    const _href = to || href
    const site = useSite()
    const locale = useLocale()

    //TODO: Add configuration value to the default.js config defining the SFRA hostname
    const urlHostname = 'https://development-internal-ccdemo.demandware.net'

    const linkType = useNavLink ? NavSPALink : SPALink

    // if alias is not defined, use site id
    const updatedHref = buildPathWithUrlConfig(_href, {
        locale: locale.alias || locale.id,
        site: site.alias || site.id
    })

    return (
        <ChakraLink
            as={SDKLink}
            to={updatedHref}
            toHostname={urlHostname}
            {...(useNavLink && {exact: true})}
            {...props}
            ref={ref}
        />
    )
})

Link.displayName = 'Link'

Link.propTypes = {href: PropTypes.string, to: PropTypes.string, useNavLink: PropTypes.bool}

export default React.memo(Link)
