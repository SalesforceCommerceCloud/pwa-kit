/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'
import {Helmet} from 'react-helmet'
import PropTypes from 'prop-types'

/**
 * Wrapper for the scripts required to use Active Data analytics
 * @param {Object.<string, string>} props
 * @param {string} [props.dwac='static/dwac-21.7.js'] - Path to the dwac script file
 * @param {string} [props.dwanalytics='static/dwanalytics-22.2.js'] - Path to the dwanalytics script file
 * @param {string} [props.headActiveData='static/head-active_data.js'] - Path to the head-active_data script file
 */
const ActiveData = ({
    dwac = getAssetUrl('static/dwac-21.7.js'),
    dwanalytics = getAssetUrl('static/dwanalytics-22.2.js'),
    headActiveData = getAssetUrl('static/head-active_data.js')
} = {}) => {
    return (
        <>
            <Helmet>
                <script src={headActiveData} id="headActiveData" type="text/javascript"></script>
            </Helmet>
            <script
                src={dwanalytics}
                id="dwanalytics"
                type="text/javascript"
                async="async"
            ></script>
            <script src={dwac} id="dwac" type="text/javascript" async="async"></script>
        </>
    )
}

ActiveData.propTypes = {
    dwac: PropTypes.string,
    dwanalytics: PropTypes.string,
    headActiveData: PropTypes.string
}

export default ActiveData
