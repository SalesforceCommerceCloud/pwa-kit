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

/**
 *  The Link component match the URL with the paths defined in routes.jsx
 *  if the URL doesn't match returns an anchor element. if it match returns a
 *  react-router component with a relative URL.
 *
 */
//TODO: Extend Link to accept prop to use react-router {Link as RouterLink} OR {NavLink as RouterNavLink}.
const Link = ({to, ...props}) => {
    let _routes = routes
    if (typeof routes === 'function') {
        _routes = routes()
    }

    const routePath = matchRoute(to, _routes)

    // Routes matching wildcard * path are consider not routables
    // TODO: Use a RegExp to match all the wildcard combinations: '*', '/*', '/*/'.
    const isRoutable = routePath.match && routePath.route.path !== '*'

    return isRoutable ? (
        // The link will be resolved by the PWA react-router.
        <RouterLink to={to} {...props} />
    ) : (
        // The link will be resolved by eCDN, thus it can be resolved by an external origin.
        //TODO: The hostname is only for testing the POC locally.
        // During production the domain will be the same for the PWA and the external origin.
        // During development we'll use a reverse proxy.
        <a href={`https://development-internal-ccdemo.demandware.net${to}`} {...props} />
    )
}

Link.propTypes = {
    to: PropTypes.string
}

export default Link
