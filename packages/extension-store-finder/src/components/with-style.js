/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import hoistNonReactStatic from 'hoist-non-react-statics'
import {createCache, StyleProvider,} from '@ant-design/cssinjs'
import {Helmet} from 'react-helmet'
import {getAssetUrl} from '@salesforce/pwa-kit-react-sdk/ssr/universal/utils'

const cache = createCache()

const withStyle = (Wrapped) => {
    /* istanbul ignore next */
    const wrappedComponentName = Wrapped.displayName || Wrapped.name
   
    /**
     * @private
     */
    const WithStyle = (props) => {
        return (
            <StyleProvider cache={cache}>
                <Helmet>
                    {/* NOTE: Make a ticket for extensions allowing their own assets/static folder. */}
                    {/* 
                        NOTE: Importing style this way for 'antd' doens't work completely with SSR and leaves a
                        flash of unstyled content. We stried inlining the style but it also doesn't work well 
                        with our rendering pattern.
                    */}
                    {/* 
                        NOTE: Update code to only load on css file based on current mode.
                    */}
                    <link rel="stylesheet" href={getAssetUrl('static/extension-store-finder/antd.dev.min.css')} />
                    <link rel="stylesheet" href={getAssetUrl('static/extension-store-finder/antd.prod.min.css')} />
                </Helmet>
                <Wrapped {...props} />
            </StyleProvider>
        )
    }

    WithStyle.displayName = `withStyle(${wrappedComponentName})`

    hoistNonReactStatic(WithStyle, Wrapped)

    return WithStyle
}

export default withStyle