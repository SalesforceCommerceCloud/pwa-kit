/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useCorrelationId} from '../../hooks'

/**
 * An HOC that injects the correlation id to a component
 * @param Component
 *
 */
const withCorrelationId = (Component) => {
    const wrappedComponentName = Component.displayName || Component.name
    const WrappedComponent = ({...passThroughProps}) => {
        const {correlationId} = useCorrelationId()

        return <Component {...passThroughProps} correlationId={correlationId} />
    }

    WrappedComponent.displayName = `withCorrelationId(${wrappedComponentName})`

    return WrappedComponent
}

export {withCorrelationId}
