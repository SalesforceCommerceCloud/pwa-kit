// @ts-nocheck 
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
import {useHistory} from 'react-router-dom'

/**
 *
 * @param {boolean} enabled - flag to turn on/off Storefront Preview feature. By default, it is set to true.
 * This flag only applies if storefront is ran in Runtime Admin iframe.
 * @param {function(): string | Promise<string>} getToken - A method that returns the access token for the current user
 */
export const StorefrontPreview = ({children, enabled = true, getToken}) => {
    const history = useHistory()
    const isHostTrusted = detectStorefrontPreview()

    useEffect(() => {
        if (enabled && isHostTrusted) {
            window.STOREFRONT_PREVIEW = {
                ...window.STOREFRONT_PREVIEW,
                getToken,
                navigate: (path, action = 'push', ...args) => {
                    history[action](path, ...args)
                }
            }
        }
    }, [enabled, getToken])

    return (
        <>
            {enabled && isHostTrusted && (
                <Helmet>
                    <script
                        id="storefront_preview"
                        src={getClientScript()}
                        async
                        type="text/javascript"
                    ></script>
                </Helmet>
            )}
            {children}
        </>
    )
}

StorefrontPreview.defaultProps = {
    enabled: true
}

StorefrontPreview.propTypes = {
    children: PropTypes.node,
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

export default StorefrontPreview
