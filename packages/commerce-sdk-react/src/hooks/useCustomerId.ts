/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthDataValue from './useAuthDataValue'

/**
 * Hook that returns the customer ID.
 *
 * @group Helpers
 * @category Shopper Authentication
 */
const useCustomerId = (): string | null => useAuthDataValue('customer_id')

export default useCustomerId
