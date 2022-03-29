/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {Redirect} from 'react-router-dom'
import PropTypes from 'prop-types'

const RedirectToSFRA = ({urlLocation}) => {
    //TODO: Add configuration value to the default.js config defining the SFRA hostname
    const urlHostname = 'https://sfra-site.com'
    return <Redirect to={`${urlHostname}${urlLocation}`} />
}

RedirectToSFRA.getProps = async ({location}) => {
    const urlLocation = `${location.pathname}${location.search}`
    return {urlLocation}
}

RedirectToSFRA.propTypes = {
    /**
     * SFRA URL pathname
     */
    urlLocation: PropTypes.string
}

export default RedirectToSFRA
