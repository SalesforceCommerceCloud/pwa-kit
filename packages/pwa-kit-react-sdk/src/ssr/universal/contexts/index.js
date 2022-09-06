/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import DeviceContext from '../device-context'
import {v4 as uuidv4} from 'uuid'

const ExpressContext = React.createContext()

export {CorrelationIdContext}

const CorrelationIdContext = React.createContext()

const CorrelationIdProvider = ({children, req}) => {
    let correlationId

    if (req) {
        // if the correlation is define in the header, use it, otherwise, generate one
        if (req.headers['x-correlation-id']) {
            correlationId = req.headers['x-correlation-id']
        } else {
            // generate on for local development on server side
            const id = uuidv4()
            console.log('Dev server correlation ID generated server side', id)
            correlationId = id
        }
    } else {
        correlationId = uuidv4()
    }

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
