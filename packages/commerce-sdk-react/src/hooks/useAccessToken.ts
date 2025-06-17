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
 * @group Shopper Authentication helpers
 */
interface AccessToken {
    token: string | null
    getTokenWhenReady: () => Promise<string>
}

/**
 * Hook that returns the access token.
 *
 * @group Helpers
 * @category Shopper Authentication
 *
 */
const useAccessToken = (): AccessToken => {
    const config = useConfig()
    const auth = useAuthContext()

    const token = onClient
        ? // This conditional is a constant value based on the environment, so the same path will
          // always be followed., and the "rule of hooks" is not violated.
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useLocalStorage(`access_token_${config.siteId}`)
        : auth.get('access_token')

    // NOTE: auth.ready() is to be called later. If you call it immediately in this hook,
    // it'll cause infinite re-renders during testing.
    const getTokenWhenReady = () => auth.ready().then(({access_token}) => access_token)

    return {token, getTokenWhenReady}
}

export default useAccessToken
