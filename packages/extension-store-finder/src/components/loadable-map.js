/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import loadable from '@loadable/component'

// Dynamically import MapComponent
const LoadableMap = loadable(() => import('./map'), {
    fallback: <div>Loading...</div>,
})

const LoadableMapComponent = (props) => {
    return (
        <div style={{ height: '400px', width: '600px' }}>
            <LoadableMap {...props}/>
        </div>
    )
}

export default LoadableMapComponent