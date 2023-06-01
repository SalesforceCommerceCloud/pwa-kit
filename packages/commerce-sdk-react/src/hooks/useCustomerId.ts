/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthContext from './useAuthContext'
import useLocalStorage from './useLocalStorage'
import useConfig from './useConfig'

const onClient = typeof window !== 'undefined'

/**
 * Hook that returns the customer ID.
 *
 * @group Helpers
 * @category Shopper Authentication
 */
const useCustomerId = (): string | null => {
    if (onClient) {
        // `onClient` is a constant, so the hooks will always have the same execution order,
        // despite technically being inside a conditional.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const config = useConfig()
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return useLocalStorage(`customer_id_${config.siteId}`)
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const auth = useAuthContext()
    return auth.get('customer_id')
}

export default useCustomerId
