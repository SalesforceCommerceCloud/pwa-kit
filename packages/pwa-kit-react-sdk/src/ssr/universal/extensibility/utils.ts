/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {applyHOCs} from '../utils'
import extensions from './extensions'

/**
 * Given the provided Application, apply all the App extensions to it.
 * 
 * @param App 
 */
export const applyAppExtensions = (App: React.ComponentType): React.ComponentType  => {
    const extendAppHocs = extensions.map(({extendApp}) => extendApp).filter(Boolean)
    
    return applyHOCs(App, extendAppHocs)
}
    