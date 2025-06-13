/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {createContext, useContext, useState} from 'react'
import PropTypes from 'prop-types'

const StoreLocatorParamsContext = createContext({
    params: null,
    setParams: () => {}
})

export const StoreLocatorParamsProvider = ({children}) => {
    const [params, setParams] = useState(null)
    return (
        <StoreLocatorParamsContext.Provider value={{params, setParams}}>
            {children}
        </StoreLocatorParamsContext.Provider>
    )
}

StoreLocatorParamsProvider.propTypes = {
    children: PropTypes.node
}

export const useStoreLocatorParams = () => useContext(StoreLocatorParamsContext)
