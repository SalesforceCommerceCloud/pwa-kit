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

    const encUserId = onClient
        ? // This conditional is a constant value based on the environment, so the same path will
          // always be followed., and the "rule of hooks" is not violated.
          // eslint-disable-next-line react-hooks/rules-of-hooks
          useLocalStorage(`enc_user_id_${config.siteId}`)
        : auth.get('enc_user_id')

    const getEncUserIdWhenReady = () => auth.ready().then(({enc_user_id}) => enc_user_id)

    return {encUserId, getEncUserIdWhenReady}
}

export default useEncUserId
