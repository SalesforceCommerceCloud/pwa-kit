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
 * @group Shopper Authentication helpers
 */
interface EncUserId {
    encUserId: string | null
    getEncUserIdWhenReady: () => Promise<string>
}

/**
 * Hook that returns the ecom user ID.
 *
 * This is sometimes used as the user ID for Einstein.
 *
 * @group Helpers
 * @category Shopper Authentication
 *
 */
const useEncUserId = (): EncUserId => {
    const config = useConfig()
    const auth = useAuthContext()
    const key = `enc_user_id_${config.siteId}`

    // When httpOnly session cookies are enabled, the SLAS proxy mirrors
    // enc_user_id as a cookie and the local-storage write is skipped, so we
    // read from cookies instead.
    const encUserId = onClient()
        ? // This conditional is a constant value based on the environment, so the same path will
          // always be followed., and the "rule of hooks" is not violated.
          config.enableHttpOnlySessionCookies
            ? // eslint-disable-next-line react-hooks/rules-of-hooks
              useCookie(key)
            : // eslint-disable-next-line react-hooks/rules-of-hooks
              useLocalStorage(key)
        : auth.get('enc_user_id')

    const getEncUserIdWhenReady = () => auth.ready().then(({enc_user_id}) => enc_user_id)

    return {encUserId, getEncUserIdWhenReady}
}

export default useEncUserId
