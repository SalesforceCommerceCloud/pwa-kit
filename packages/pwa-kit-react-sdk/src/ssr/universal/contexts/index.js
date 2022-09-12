/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import DeviceContext from '../device-context'
import {v4 as uuid} from 'uuid'
const ExpressContext = React.createContext()

export {CorrelationIdContext}

const CorrelationIdContext = React.createContext()

const CorrelationIdProvider = ({children, correlationId}) => {
    const [id, reset] = React.useState(correlationId)
    const handleReset = () => {
        const newId = uuid()
        reset(newId)
    }
    return (
        <CorrelationIdContext.Provider value={{correlationId: id, reset: handleReset}}>
            {children}
        </CorrelationIdContext.Provider>
    )
}

export {CorrelationIdProvider, DeviceContext, ExpressContext}
