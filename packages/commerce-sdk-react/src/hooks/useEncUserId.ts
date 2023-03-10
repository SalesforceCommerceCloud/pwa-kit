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
 * TBD
 *
 */
const useEncUserId = (): string | null => {
    if (onClient) {
        const config = useConfig()
        return useLocalStorage(`${config.siteId}_enc_user_id`)
    }
    const auth = useAuthContext()
    return auth.get('enc_user_id')
}

export default useEncUserId
