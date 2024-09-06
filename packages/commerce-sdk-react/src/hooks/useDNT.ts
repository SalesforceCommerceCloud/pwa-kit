/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthContext from './useAuthContext'
import useConfig from './useConfig'

interface useDntReturn {
    dntStatus: boolean | undefined
    updateDNT: (preference: boolean | null) => Promise<void>
}

/**
 * Hook that returns
 * dntStatus - a boolean indicating the current DNT preference
 * updateDNT - a function that takes a DNT preference and creates the dw_dnt
 *              cookie and reauthroizes with SLAS
 *
 * @group Helpers
 * @category DNT
 *
 */
const useDNT = (): useDntReturn => {
    const auth = useAuthContext()
    const config = useConfig()
    const dwDntValue = auth.getDnt()

    const updateDNT = async (preference: boolean | null) => {
        let dntCookieVal = String(Number(preference))
        // Use defaultDNT if defined. If not, use SLAS default DNT
        if (preference === null) {
            dntCookieVal = config.defaultDnt ? String(Number(config.defaultDnt)) : '0'
        }
        // Set the cookie once to include dnt in the access token and then again to set the expiry time
        auth.setDnt(dntCookieVal)
        const accessToken = auth.get('access_token')
        if (accessToken !== '') {
            const {dnt} = auth.parseSlasJWT(auth.get('access_token'))
            if (dnt !== dntCookieVal) {
                await auth.refreshAccessToken()
            }
        } else {
            await auth.refreshAccessToken()
        }
        if (preference !== null) {
            auth.setDnt(dntCookieVal, Number(auth.get('refresh_token_expires_in')))
        }
    }

    let dntStatus = undefined
    if (dwDntValue && (dwDntValue === '1' || dwDntValue === '0'))
        dntStatus = Boolean(Number(dwDntValue))
    return {dntStatus, updateDNT}
}

export default useDNT
