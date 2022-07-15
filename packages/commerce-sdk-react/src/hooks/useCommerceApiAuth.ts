/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {CommerceAPIAuthContext} from '../provider'

/**
 * @internal
 */
const useCommerceApiAuth = () => {
    return React.useContext(CommerceAPIAuthContext)
}

export default useCommerceApiAuth
