/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import hoistNonReactStatic from 'hoist-non-react-statics'
import {AppErrorContext} from '../../components/app-error-boundary'

/**
 * @private
 */
export const withErrorHandling = (Wrapped) => {
    /* istanbul ignore next */
    const wrappedComponentName = Wrapped.displayName || Wrapped.name

    const WithErrorHandling = (props) => (
        <AppErrorContext.Consumer>
            {(ctx) => <Wrapped {...props} {...ctx} />}
        </AppErrorContext.Consumer>
    )

    // Expose statics from the wrapped component on the HOC
    hoistNonReactStatic(WithErrorHandling, Wrapped)

    WithErrorHandling.displayName = `withErrorHandling(${wrappedComponentName})`

    return WithErrorHandling
}

export default withErrorHandling
