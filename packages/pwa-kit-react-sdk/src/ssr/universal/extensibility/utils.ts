/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {applyHOCs} from '../utils'
import {IApplicationExtension} from './types'

/**
 * Given the provided Application, apply all the App extensions to it.
 *
 * @param App
 */
export const applyAppExtensions = (
    App: React.ComponentType,
    extensions: IApplicationExtension[]
): React.ComponentType => {
    const extendAppHocs = extensions.map(({extendApp}) => extendApp).filter(Boolean)

    return applyHOCs(App, extendAppHocs)
}
