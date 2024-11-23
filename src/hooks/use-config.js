/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useMemo} from 'react'

// Platform Imports
import {useApplicationExtensions} from '@salesforce/pwa-kit-extension-sdk/react'

/**
 * This hook returns the configuration for the current application extenson.
 */
export const useConfig = () => {
    // TODO: We should probably just have a "filter" option for this hook so that we can pass in some filters
    // and get the appropriate result so we aren't always writing the same find logic.
    const applicationExtensions = useApplicationExtensions()

    // NOTE: The Application Extensions aren't going to change as they are set once and never set again
    // but lets future proof this in case we have some sore of dynamic loading of extensions in the future.
    const extension = useMemo(
        () =>
            applicationExtensions.find(
                (extension) =>
                    extension.constructor.id === `@salesforce/extension-chakra-storefront`
            ),
        [applicationExtensions]
    )

    if (extension === undefined) {
        throw new Error(`'useConfig' could find your current application extension instance!`)
    }

    return extension.getConfig()
}
