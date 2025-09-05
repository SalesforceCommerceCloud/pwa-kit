/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useSearchStores} from '@salesforce/commerce-sdk-react'

export type Stores = NonNullable<ReturnType<typeof useSearchStores>['data']>['data']
export type Store = Stores[number]
