/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {CommerceApiContext} from '../provider'
import {ApiClients} from './types'

/**
 * Access a set of initialized Commerce API clients, which are initialized using the configurations passed to the CommerceApiProvider.
 *
 * @group Helpers
 *
 * @returns Commerce API clients
 */
const useCommerceApi = (): ApiClients => {
    return React.useContext(CommerceApiContext)
}

export default useCommerceApi
