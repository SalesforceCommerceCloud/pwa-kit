/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import Auth from '../auth'
import {AuthContext} from '../provider'

/**
 * TBD
 *
 * @internal
 */
const useAuthContext = (): Auth => {
    const context = React.useContext(AuthContext)
    if (!context) {
        throw new Error('Missing CommerceApiProvider. You probably forget to render the provider.')
    }
    return context
}

export default useAuthContext
