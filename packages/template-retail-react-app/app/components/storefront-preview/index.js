/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {Helmet} from 'react-helmet'
import PropTypes from 'prop-types'

const StorefrontPreview = ({rerender}) => {
    console.log('rerendering SFP')
    useEffect(() => {
        window.STOREFRONT_PREVIEW = {
            ...window.STOREFRONT_PREVIEW,
            // Customize Storefront Preview here!
            rerender
        }
        return () => {
            // If needed, clean up your customizations here.
            window.STOREFRONT_PREVIEW.rerender = () => {}
        }
    }, [])

    return (
        <Helmet>
            <script
                src="https://runtime-admin-preview.mobify-storefront.com/mobify/bundle/410/static/storefront-preview.js"
                type="text/javascript"
            ></script>
        </Helmet>
    )
}

StorefrontPreview.propTypes = {
    rerender: PropTypes.func
}

export default StorefrontPreview
