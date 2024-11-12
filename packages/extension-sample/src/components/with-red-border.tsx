/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

export const FooContext = React.createContext('initial-value')

// Define the HOC function
const withRedBorder = <T extends object>(WrappedComponent: React.ComponentType<T>) => {
    const ComponentWithRedBorder: React.FC<T> = (props) => (
        <FooContext.Provider value="foobar">
            <div style={{border: '2px solid red', padding: '8px'}}>
                <WrappedComponent {...props} />
            </div>
        </FooContext.Provider>
    )

    ComponentWithRedBorder.displayName = `WithRedBorder(${
        WrappedComponent.displayName || WrappedComponent.name || 'Component'
    })`

    return ComponentWithRedBorder
}

export default withRedBorder
