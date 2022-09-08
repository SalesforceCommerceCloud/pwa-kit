/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import DeviceContext from '../device-context'

const ExpressContext = React.createContext()

export {CorrelationIdContext}

const CorrelationIdContext = React.createContext()

const CorrelationIdProvider = ({children, correlationId}) => {
    return (
        <CorrelationIdContext.Provider value={{correlationId}}>
            {children}
        </CorrelationIdContext.Provider>
    )
}
const useCorrelationId = () => {
    const context = React.useContext(CorrelationIdContext)
    if (context === undefined) {
        throw new Error('useCorrelationId needs to be used within CorrelationIdProvider')
    }
    return context
}

export {useCorrelationId, CorrelationIdProvider, DeviceContext, ExpressContext}
