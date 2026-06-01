/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthContext from './useAuthContext'
import useAuthDataValue from './useAuthDataValue'

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
    const auth = useAuthContext()
    const encUserId = useAuthDataValue('enc_user_id')
    const getEncUserIdWhenReady = () => auth.ready().then(({enc_user_id}) => enc_user_id)

    return {encUserId, getEncUserIdWhenReady}
}

export default useEncUserId
