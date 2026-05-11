/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthContext from './useAuthContext'
import useLocalStorage from './useLocalStorage'
import useCookie from './useCookie'
import useConfig from './useConfig'
import {onClient} from '../utils'

/**
 * Hook that returns the customer ID.
 *
 * @group Helpers
 * @category Shopper Authentication
 */
const useCustomerId = (): string | null => {
    if (onClient()) {
        // `onClient` is a constant, so the hooks will always have the same execution order,
        // despite technically being inside a conditional.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const config = useConfig()
        const key = `customer_id_${config.siteId}`
        // When httpOnly session cookies are enabled, the SLAS proxy mirrors
        // customer_id as a cookie and the local-storage write is skipped, so
        // we read from cookies instead.
        // eslint-disable-next-line react-hooks/rules-of-hooks
        return config.enableHttpOnlySessionCookies ? useCookie(key) : useLocalStorage(key)
    }
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const auth = useAuthContext()
    return auth.get('customer_id')
}

export default useCustomerId
