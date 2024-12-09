/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'

import {StoreLocatorList} from './list'
import {StoreLocatorForm} from './form'
import {StoreLocatorHeading} from 'overridable!./heading'

export const StoreLocatorContent = (): JSX.Element => {
    return (
        <>
            <StoreLocatorHeading />
            <StoreLocatorForm />
            <StoreLocatorList />
        </>
    )
}
