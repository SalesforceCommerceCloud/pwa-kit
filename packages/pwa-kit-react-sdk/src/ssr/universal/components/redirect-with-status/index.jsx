/*
 * Copyright (c) 2024, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Redirect, withRouter} from 'react-router-dom'
import PropTypes from 'prop-types'

/**
 * The `RedirectWithStatus` component is used to specify a different status code when redirecting via
 * the Redirect component.
 * The default redirect behavior when this component is not used is to set a 302 status.
 *
 * @param {number} status - The HTTP status code. Defaults to 302 if not specified
 * @param {object} staticContext - The router context
 * @param {string} to - The redirect's target path
 */
const RedirectWithStatus = ({status = 302, staticContext, ...props}) => {
    // Handle server-side rendering
    if (staticContext) {
        staticContext.status = status
    }

    return <Redirect {...props} />
}

RedirectWithStatus.propTypes = {
    status: PropTypes.number,
    staticContext: PropTypes.object,
    to: PropTypes.oneOfType([PropTypes.string, PropTypes.object])
}

export default withRouter(RedirectWithStatus)
