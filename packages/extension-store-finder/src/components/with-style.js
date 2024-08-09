/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import hoistNonReactStatic from 'hoist-non-react-statics'
import {createCache, extractStyle, StyleProvider,} from '@ant-design/cssinjs'
import {Helmet} from 'react-helmet'

const cache = createCache()

// Private
const parseAttributes = (attributeString) => {
    const attributes = {}
    const attrRegex = /([a-zA-Z\-]+)="([^"]*)"/g
    let match
  
    while ((match = attrRegex.exec(attributeString)) !== null) {
        const key = match[1]
        const value = match[2]
        attributes[key] = value
    }
  
    return attributes  
}

const withStyle = (Wrapped) => {
    /* istanbul ignore next */
    const wrappedComponentName = Wrapped.displayName || Wrapped.name
    
    /**
     * @private
     */
    class WithStyle extends React.Component {

        render() {
            const styleText = extractStyle(cache)
            const regex = /<style([^>]*)>([\s\S]*?)<\/style>/gi
            const matches = [...styleText.matchAll(regex)]

            return (
                <StyleProvider cache={cache}>
                    <Helmet>
                        {
                            matches.map((match, index) => {
                                const rawAttributes = match[1].trim()
                                const innerHTML = match[2].trim()
                                const attributes = parseAttributes(rawAttributes)

                                return <style {...attributes} key={`antd_${index}`}>{innerHTML}</style>
                            })
                        }
                    </Helmet>
                    <Wrapped {...this.props} />
                </StyleProvider>
            )
        }
    }

    WithStyle.displayName = `withStyle(${wrappedComponentName})`

    hoistNonReactStatic(WithStyle, Wrapped)

    return WithStyle
}

export default withStyle