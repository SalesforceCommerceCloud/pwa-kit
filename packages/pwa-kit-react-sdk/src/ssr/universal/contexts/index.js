/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef} from 'react'
import PropTypes from 'prop-types'
import {useLocation} from 'react-router-dom'
import DeviceContext from '../device-context'

const ExpressContext = React.createContext()

const CorrelationIdContext = React.createContext()

const CorrelationIdProvider = ({children, correlationId, resetOnPageChange = true}) => {
    const _correlationIdFn = typeof correlationId === 'function' && correlationId
    const _correlationId = typeof correlationId !== 'function' && correlationId
    if (resetOnPageChange && !_correlationIdFn) {
        console.warn(
            'correlationId needs to be a function returning a uuid string when resetOnPageChange is true'
        )
    }
    const [id, setId] = React.useState(_correlationId || _correlationIdFn())
    const location = useLocation()

    const isFirstRun = useRef(true)
    useEffect(() => {
        // this hook only runs on client-side
        // don't run this on first render
        if (isFirstRun.current) {
            isFirstRun.current = false
            return
        }

        if (resetOnPageChange && _correlationIdFn) {
            // NOTE: the function needs to be an uuid v4.
            const newId = _correlationIdFn()
            setId(newId)
        }
    }, [location.pathname])

    return (
        <CorrelationIdContext.Provider value={{correlationId: id}}>
            {children}
        </CorrelationIdContext.Provider>
    )
}

CorrelationIdProvider.propTypes = {
    children: PropTypes.element.isRequired,
    resetOnPageChange: PropTypes.bool,
    correlationId: PropTypes.oneOfType([PropTypes.string, PropTypes.func]).isRequired,
    location: PropTypes.object
}

export {CorrelationIdContext, CorrelationIdProvider, DeviceContext, ExpressContext}
