/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useContext} from 'react'
import {CustomerProductListsContext} from '../contexts'

export const useProductLists = () => {
    const context = useContext(CustomerProductListsContext)

    if (context === undefined) {
        throw new Error('useProductLists must be used within CustomerProductListsProvider')
    }
    return context
}
