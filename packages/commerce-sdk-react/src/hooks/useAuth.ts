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
const useAuth = (): Auth => {
    return React.useContext(AuthContext)
}

export default useAuth
