/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useContext} from 'react'
import {useParams, useLocation} from 'react-router-dom'
import AppConfig from '../../universal/components/_app-config'

export interface GetPropsArgs {
    location: Location
    params: {[key: string]: string}
    req: object | undefined // Get type from runtime?
    res: object | undefined // Get type from runtime?
    [key: string]: object | string | number // This accounts for all the `extraGetPropsArgs` values.
}

const Context = React.createContext({} as GetPropsArgs)
const useGetPropsArgs = () => useContext(Context)

export const GetPropsArgsProvider = ({children, serverProps}) => {
    const location = useLocation()
    const params = useParams()
    const extraArgs = AppConfig.extraGetPropsArgs(serverProps?.req?.locals || {})

    return (
        <Context.Provider value={{location, params, ...serverProps, ...extraArgs}}>
            {children}
        </Context.Provider>
    )
}
export default useGetPropsArgs