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
 * Hook that returns the usid associated with the current access token.
 *
 */
const useUsid = (): string | null => {
    if (onClient) {
        const config = useConfig()
        return useLocalStorage(`${config.siteId}_usid`)
    }
    const auth = useAuthContext()
    return auth.get('usid')
}

export default useUsid
