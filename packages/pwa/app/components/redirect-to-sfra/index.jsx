/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Redirect} from 'react-router-dom'
import PropTypes from 'prop-types'

const RedirectToSFRA = ({urlPathname}) => {
    //TODO: Add configuration value to define the SFRA hostname
    const urlHostname = 'sfra-site.com'
    return <Redirect to={`${urlHostname}${urlPathname}`} />
}

RedirectToSFRA.getProps = async ({location}) => {
    const urlPathname = `${location.pathname}${location.search}`
    return {urlPathname}
}

RedirectToSFRA.propTypes = {
    /**
     * SFRA URL pathname
     */
    urlPathname: PropTypes.string
}

export default RedirectToSFRA
