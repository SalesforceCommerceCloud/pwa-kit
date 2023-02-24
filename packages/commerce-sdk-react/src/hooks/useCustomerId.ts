/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuth from './useAuth'
import useLocalStorage from './useLocalStorage'
import useConfig from './useConfig'

const onClient = typeof window !== 'undefined'

/**
 * TBD
 *
 */
const useCustomerId = (): string | null => {
    if (onClient) {
        const config = useConfig()
        return useLocalStorage(`${config.siteId}_customer_id`)
    }
    const auth = useAuth()
    return auth.get('customer_id')
}

export default useCustomerId
