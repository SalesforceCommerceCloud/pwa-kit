/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useApplicationExtensions} from '@salesforce/pwa-kit-extension-sdk/react'

export const useConfig = () => {
    const applicationExtensions = useApplicationExtensions()
    // TODO: fix this to get by "id"
    return applicationExtensions[0].getConfig()
}
