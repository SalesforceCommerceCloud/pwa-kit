/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'

export const AppContext = React.createContext({})

// THINK: Should we have a state for context so it can be manipulated in the future? If we want to do this,
// it will determine how we should setup the contexts value object structure.
// export const AppContextProvider = ({children}) => {
//     const [context, setContext] = useState({})

//     return (
//         <AppContext.Provider value={{context, setContext}}>
//             {children}
//         </AppContext.Provider>
//     )
// }
