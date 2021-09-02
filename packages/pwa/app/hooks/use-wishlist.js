/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {useCustomerProductList} from '../commerce-api/hooks/useCustomerProductList'

const PWA_DEFAULT_WISHLIST_NAME = 'PWA wishlist'
const useWishlist = (options) => useCustomerProductList(PWA_DEFAULT_WISHLIST_NAME, options)

export default useWishlist
