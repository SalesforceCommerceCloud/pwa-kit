/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import DeviceContext from '../device-context'
import {v4 as uuid} from 'uuid'
import {withRouter} from 'react-router-dom'

const ExpressContext = React.createContext()

const CorrelationIdContext = React.createContext()

const CorrelationIdProvider = ({children, correlationId, location}) => {
    const [id, setId] = React.useState(correlationId)
    React.useEffect(() => {
        const newId = uuid()
        setId(newId)
    }, [location.pathname])
    return (
        <CorrelationIdContext.Provider value={{correlationId: id}}>
            {children}
        </CorrelationIdContext.Provider>
    )
}

const CorrelationIdProviderWithRouter = withRouter(CorrelationIdProvider)

export {
    CorrelationIdContext,
    CorrelationIdProviderWithRouter as CorrelationIdProvider,
    DeviceContext,
    ExpressContext
}
