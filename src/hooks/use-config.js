/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useMemo} from 'react'

// Platform Imports
import {useApplicationExtensions} from '@salesforce/pwa-kit-extension-sdk/react'

// Local Imports
import {id} from '../config'

/**
 * This hook returns the configuration for the current application extenson.
 */
export const useConfig = () => {
    const applicationExtensions = useApplicationExtensions()

    // NOTE: The Application Extensions aren't going to change as they are set once and never set again
    // but lets future proof this in case we have some sore of dynamic loading of extensions in the future.
    const extension = useMemo(() => {
        return applicationExtensions.find((extension) => extension.getConfig().id === id)
    }, [applicationExtensions])

    return extension.getConfig()
}
