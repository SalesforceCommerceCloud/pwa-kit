/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {ApplicationExtensionsContext} from '../contexts'
import {ApplicationExtension} from '../ApplicationExtension'
import {ApplicationExtensionConfig as Config} from '../../types'

/**
 * Custom React hook to get all the Application Extensions currently used
 */
const useApplicationExtensions = (): ApplicationExtension<Config>[] => {
    const context = useContext(ApplicationExtensionsContext)

    if (context === undefined) {
        throw new Error(
            'useApplicationExtensions must be used within ApplicationExtensionsProvider'
        )
    }

    return context
}

export default useApplicationExtensions
