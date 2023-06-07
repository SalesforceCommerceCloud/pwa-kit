/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthContext from './useAuthContext'

/**
 * @group Shopper Authentication helpers
 */
interface Usid {
    usid: string | null
    getUsidWhenReady: () => Promise<string>
}

/**
 * Hook that returns the usid associated with the current access token.
 *
 * @group Helpers
 * @category Shopper Authentication
 */
const useUsid = (): Usid => {
    const auth = useAuthContext()
    const usid = auth.get('usid')

    // NOTE: auth.ready() is to be called later. If you call it immediately in this hook,
    // it'll cause infinite re-renders during testing.
    const getUsidWhenReady = () => auth.ready().then(({usid}) => usid)

    return {usid, getUsidWhenReady}
}

export default useUsid
