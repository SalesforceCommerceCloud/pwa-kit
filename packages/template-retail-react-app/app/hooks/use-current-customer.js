/*
 * Copyright (c) 2022, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/**
 * A hook that returns the current state of the app.
 * It is a combination of many commerce-sdk-react hooks that needs to be used together in many places.
 */
import {useContext} from 'react'
import {CustomerContext} from '../contexts'
export const useCurrentCustomer = () => {
    const context = useContext(CustomerContext)
    if (context === undefined) {
        throw new Error('useCurrentCustomer must be used within CustomerProvider')
    }
    return context
}
