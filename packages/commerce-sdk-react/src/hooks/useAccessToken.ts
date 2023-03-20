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

interface AccessToken {
    token: string | null
    tokenWhenReady: Promise<string>
}

/**
 * Hook that returns the access token.
 *
 */
const useAccessToken = (): AccessToken => {
    const config = useConfig()
    const auth = useAuthContext()

    const token = onClient
        ? useLocalStorage(`${config.siteId}_access_token`)
        : auth.get('access_token')

    const tokenWhenReady = auth.ready().then(({access_token}) => access_token)

    return {token, tokenWhenReady}
}

export default useAccessToken
