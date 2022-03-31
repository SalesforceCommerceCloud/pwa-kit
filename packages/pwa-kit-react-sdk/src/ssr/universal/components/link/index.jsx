/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import PropTypes from 'prop-types'
import {Link as RouterLink} from 'react-router-dom'
import {matchRoute} from '../../utils'
import routes from '../../routes'
import {getAppOrigin} from '../../../../utils/url'

/**
 *  The Link component match the URL with the paths defined in routes.jsx
 *  if the URL doesn't match returns an anchor element. if it match returns a
 *  react-router component with a relative URL.
 *
 */
const Link = (props) => {
    const {to, toHostname = getAppOrigin(), ...rest} = props
    let _routes = routes
    if (typeof routes === 'function') {
        _routes = routes()
    }

    // Remove routes with * path
    _routes = _routes.filter((_route) => _route.path !== '*')

    const isMatch = matchRoute(to, _routes).match
    return isMatch ? <RouterLink to={to} {...rest} /> : <a href={`${toHostname}${to}`} {...rest} />
}

Link.propTypes = {
    to: PropTypes.string,
    toHostname: PropTypes.string
}

export default Link
