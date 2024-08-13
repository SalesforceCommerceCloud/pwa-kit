/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
import loadable from '@loadable/component'

// Dynamically import MapComponent
const LoadableMap = loadable(() => import('./map'), {
    fallback: <div>Loading...</div>,
})

const LoadableMapComponent = (props) => {
    const [visible, setVisible] = useState(false)

    useEffect(() => {
        setVisible(true)
    }, [])

    return (
        <div style={{ height: '550px', width: '1000px' }}>
            {visible && <LoadableMap {...props}/>}
        </div>
    )
}

export default LoadableMapComponent