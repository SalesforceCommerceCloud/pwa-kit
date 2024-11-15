/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useContext} from 'react'
import {FooContext} from '$/components/with-red-border'

// Define the HOC function
const withUsingFoo = <T extends object>(WrappedComponent: React.ComponentType<T>) => {
    const ComponentWithUsingFoo: React.FC<T> = (props) => {
        const context = useContext(FooContext)
        console.log('--- context should be `foobar`:', context)

        return <WrappedComponent {...props} />
    }

    ComponentWithUsingFoo.displayName = `WithUsingFoo(${
        WrappedComponent.displayName || WrappedComponent.name || 'Component'
    })`

    return ComponentWithUsingFoo
}

export default withUsingFoo
