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

export const StorefrontPreview = ({
    enabled = typeof window !== 'undefined' ? Boolean(window.STOREFRONT_PREVIEW?.enabled) : false,
    getToken
}) => {
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
    isHostTrusted = detectStorefrontPreview()
    console.log('enabled', enabled)
    console.log('isHostTrusted', isHostTrusted)
    return (
        <>
            <Helmet>
                <script src={getClientScript()} type="text/javascript"></script>
            </Helmet>
        </>
    )
}

StorefrontPreview.propTypes = {
    enabled: PropTypes.bool,
    getToken: PropTypes.func
}
