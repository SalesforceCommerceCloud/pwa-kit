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

    // TODO: auth.get does not trigger a re-render.
    // This is fine for now since the only time the usid changes is on logout
    // and currently when we log out we redirect to the login page which
    // causes components to unmount.
    // This will need to change if we stay on the PDP after logout
    const usid = auth.get('usid')

    const getUsidWhenReady = () => auth.ready().then(({usid}) => usid)

    return {usid, getUsidWhenReady}
}

export default useUsid
