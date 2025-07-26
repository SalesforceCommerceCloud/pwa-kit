/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {StoreLocatorList} from '@salesforce/retail-react-app/app/components/store-locator/list'
import {StoreLocatorForm} from '@salesforce/retail-react-app/app/components/store-locator/form'
import {StoreLocatorHeading} from '@salesforce/retail-react-app/app/components/store-locator/heading'

export const StoreLocator = () => {
    return (
        <>
            <StoreLocatorHeading />
            <StoreLocatorForm />
            <StoreLocatorList />
        </>
    )
}
