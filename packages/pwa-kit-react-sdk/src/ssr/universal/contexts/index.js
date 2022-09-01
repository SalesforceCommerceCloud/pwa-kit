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
    // Note correlationId cannot be longer than 32 characters, and allows the characters A-Za-z0-9 '-' '_'
    // amz
    let correlationId
    const id = uuidv4().substring(0, 28)
    if (req) {
        // if req.headers['x-amz-cf-id'] is defined, use it
        if (req.headers['x-amz-cf-id']) {
            correlationId = req.headers['x-amz-cf-id'].substring(0, 28)
        } else {
            correlationId = `ser_${id}`
        }
    } else {
        correlationId = `cli_${id}`
    }
    return (
        <CorrelationIdContext.Provider value={{correlationId}}>
            {children}
        </CorrelationIdContext.Provider>
    )
}
const useCorrelationId = () => {
    const context = React.useContext(CorrelationIdContext)
    console.log('context', context)
    if (context === undefined) {
        throw new Error('useCorrelationId needs to be used within CorrelationIdProvider')
    }
    return context
}

export {useCorrelationId, CorrelationIdProvider, DeviceContext, ExpressContext}
