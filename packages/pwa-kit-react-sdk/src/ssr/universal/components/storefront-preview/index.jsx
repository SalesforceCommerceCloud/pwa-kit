/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect} from 'react'
import PropTypes from 'prop-types'
import {Helmet} from 'react-helmet'
import {detectStorefrontPreview, getClientScript} from './utils'

/**
 *
 * @param {boolean} enabled - flag to turn on/off Storefront Preview feature
 * @param  {function(): string | Promise<string>} getToken - A method that returns the access token for the current user
 */
export const StorefrontPreview = ({enabled = true, getToken}) => {
    let isHostTrusted
    useEffect(() => {
        if (enabled && isHostTrusted) {
            window.STOREFRONT_PREVIEW = {
                ...window.STOREFRONT_PREVIEW,
                getToken
            }
        }
    }, [enabled, getToken])
    if (!enabled) {
        return null
    }
    // We only want to run this function when enabled is on
    isHostTrusted = detectStorefrontPreview()
    return isHostTrusted ? (
        <Helmet>
            <script
                id="storefront_preview"
                src={getClientScript()}
                async
                type="text/javascript"
            ></script>
        </Helmet>
    ) : null
}

StorefrontPreview.defaultProps = {
    enabled: true
}

StorefrontPreview.propTypes = {
    enabled: PropTypes.bool,
    // a custom prop type function to only require this prop if enabled is true.
    getToken: function (props, propName, componentName) {
        if (
            props['enabled'] === true &&
            (props[propName] === undefined || typeof props[propName] !== 'function')
        ) {
            return new Error(
                `${propName} is a required function for ${componentName} when enabled is true`
            )
        }
    }
}
