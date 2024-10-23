/*
 * Copyright (c) 2023, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

// Local
// TODO: We can probably pass this in as an initial value.?
// import {getApplicationExtensions} from '../../shared/utils/universal-utils'
import ApplicationExtensionsContext from './ApplicationExtensionsContext'

// TODO: Clean this up.
type ApplicationExtensionsProviderProps = {
    children: any
}

const ApplicationExtensionsProvider = ({children}: ApplicationExtensionsProviderProps) => {
    // const extensions = getApplicationExtensions()

    return (
        <ApplicationExtensionsContext.Provider value={[]}>
            {children}
        </ApplicationExtensionsContext.Provider>
    )
}

export default ApplicationExtensionsProvider
