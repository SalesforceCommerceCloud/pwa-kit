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
 * @callback onInitCallback
 */

/**
 *
 * @param {boolean} enabled - flag to turn on/off Storefront Preview feature
 * @param  {function(): string | Promise<string>} getToken - A method that returns the access token for the current user
 * @param  {Array} experimentalUnsafeAdditionalSearchParams - An array of key/value search params to add when context changes
 * @param  {boolean} experimentalUnsafeReloadServerSide - if true, will reload the page on server side when context changes
 * @param  {onInitCallback} onInit - callback that runs when initializing Storefront Preview
 */
export const StorefrontPreview = ({
    children,
    enabled = true,
    getToken,
    experimentalUnsafeAdditionalSearchParams = [],
    experimentalUnsafeReloadServerSide,
    // eslint-disable-next-line
    onInit = () => {}
}) => {
    const history = useHistory()
    const isHostTrusted = detectStorefrontPreview()

    useEffect(() => {
        if (enabled && isHostTrusted) {
            window.STOREFRONT_PREVIEW = {
                ...window.STOREFRONT_PREVIEW,
                getToken,
                experimentalUnsafeNavigate: (path, action = 'push', ...args) => {
                    history[action](path, ...args)
                },
                experimentalUnsafeAdditionalSearchParams,
                experimentalUnsafeReloadServerSide
            }
        }
    }, [
        enabled,
        getToken,
        experimentalUnsafeAdditionalSearchParams,
        experimentalUnsafeReloadServerSide
    ])

    useEffect(() => {
        if (enabled && isHostTrusted) {
            onInit()
        }
    }, [enabled])

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
    enabled: true,
    experimentalUnsafeReloadServerSide: false
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
    },
    experimentalUnsafeAdditionalSearchParams: PropTypes.array,
    experimentalUnsafeReloadServerSide: PropTypes.bool,
    onInit: PropTypes.func
}

export default StorefrontPreview
