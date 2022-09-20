/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import hoistNonReactStatic from 'hoist-non-react-statics'
import {FetchStrategy} from './fetchStrategy'
import React from 'react'

export const withLegacyGetProps = (Wrapped) => {
    const wrappedComponentName = Wrapped.displayName || Wrapped.name

    /**
     * @private
     */
    class WithLegacyGetProps extends FetchStrategy {
        render() {
            return <Wrapped {...this.props} />
        }

        /**
         * @private
         */
        static async doInitAppState({App, match, route, req, res, location}) {
            const {params} = match

            const components = [App, route.component]
            const promises = components.map((c) =>
                c.getProps
                    ? c.getProps({
                          req,
                          res,
                          params,
                          location
                      })
                    : Promise.resolve({})
            )

            const [appProps, pageProps] = await Promise.all(promises)
            return {
                appProps,
                pageProps
            }
        }

        /**
         * @private
         */
        static getInitializers() {
            return [WithLegacyGetProps.doInitAppState, ...(Wrapped.getInitializers?.() ?? [])]
        }

        /**
         * @private
         */
        static getHOCsInUse() {
            return [withLegacyGetProps, ...(Wrapped.getHOCsInUse?.() ?? [])]
        }
    }

    WithLegacyGetProps.displayName = `withLegacyGetProps(${wrappedComponentName})`

    const exclude = {doInitAppState: true, getInitializers: true, initAppState: true}
    hoistNonReactStatic(WithLegacyGetProps, Wrapped, exclude)

    return WithLegacyGetProps
}
