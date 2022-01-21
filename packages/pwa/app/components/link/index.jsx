/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Link as ChakraLink} from '@chakra-ui/react'
import {Link as SPALink, NavLink as NavSPALink, useHistory} from 'react-router-dom'
import {useIntl} from 'react-intl'
import useSite from '../../hooks/use-site'
import {buildPathWithUrlConfig, resolveConfigFromUrl} from '../../utils/url-config'
import {getDefaultLocaleBySite} from '../../utils/utils'

const Link = React.forwardRef(({href, to, useNavLink = false, ...props}, ref) => {
    const _href = to || href
    const {locale} = useIntl()
    const site = useSite()
    const history = useHistory()
    const {location} = history

    const configValue = resolveConfigFromUrl(`${location.pathname}${location.search}`)
    const defaultLocale = getDefaultLocaleBySite(site)

    const updatedHref = buildPathWithUrlConfig(_href, {
        ...configValue,
        locale: {
            value: configValue.locale.value || locale,
            defaultLocale
        }
    })

    return (
        <ChakraLink
            as={useNavLink ? NavSPALink : SPALink}
            {...(useNavLink && {exact: true})}
            {...props}
            to={_href === '/' ? '/' : updatedHref}
            ref={ref}
        />
    )
})

Link.displayName = 'Link'

Link.propTypes = {href: PropTypes.string, to: PropTypes.string, useNavLink: PropTypes.bool}

export default React.memo(Link)
