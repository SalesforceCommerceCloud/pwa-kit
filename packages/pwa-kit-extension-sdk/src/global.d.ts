/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {SerializedRouteProps} from './types'

declare global {
    interface Window {
        __EXTENSIONS__: {
            [key: string]: {
                routes: SerializedRouteProps[]
            }
        }
    }
}

export {} // Ensures this is treated as a module
