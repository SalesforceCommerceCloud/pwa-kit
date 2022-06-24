/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// reference https://youtu.be/J-g9ZJha8FE?t=999
import React from 'react'

export const makeStore = (reducer, initialState = {}) => {
    const DispatchContext = React.createContext()
    const StoreContext = React.createContext()

    const StoreProvider = ({children}) => {
        const [store, dispatch] = React.useReducer(reducer, initialState)

        return (
            <DispatchContext.Provider value={dispatch}>
                <StoreContext.Provider value={store}>{children}</StoreContext.Provider>
            </DispatchContext.Provider>
        )
    }

    function useDispatch() {
        return React.useContext(DispatchContext)
    }

    function useStore() {
        return React.useContext(StoreContext)
    }

    return {StoreProvider, useDispatch, useStore}
}
