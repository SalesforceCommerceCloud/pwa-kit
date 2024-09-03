/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState} from 'react'
import useAuthContext from './useAuthContext'
import {getDefaultCookieAttributes} from '../utils'
import Cookies from 'js-cookie'

interface useDntReturn {
    dntNotSet: boolean
    updateDNT: (preference: boolean | null) => Promise<void>
}

/**
 * Hook that updates the DNT preference and refreshes access token.
 *
 * @group Helpers
 * @category Shopper Authentication
 *
 */
const useDNT = (): useDntReturn => {
    const auth = useAuthContext()

    const dwDntValue = Cookies.get('dw_dnt')
    const dntCookieIsDefined = dwDntValue !== '1' && dwDntValue !== '0'
    const [dntNotSet, setDntNotSet] = useState(dntCookieIsDefined)

    const updateDNT = async (preference: boolean | null) => {
        let dntCookieVal = String(Number(preference))
        // Use defaultDNT if defined. If not, use SLAS default DNT
        if (preference === null)
            dntCookieVal = auth.defaultDnt ? String(Number(auth.defaultDnt)) : '0'

        // Set the cookie once to include dnt in the access token and then again to set the expiry time
        Cookies.set('dw_dnt', dntCookieVal, {
            ...getDefaultCookieAttributes()
        })
        setDntNotSet(false)
        await auth.refreshAccessToken()

        if (preference !== null) {
            const daysUntilExpires = Number(auth.get('refresh_token_expires_in')) / 86400
            Cookies.set('dw_dnt', dntCookieVal, {
                ...getDefaultCookieAttributes(),
                expires: daysUntilExpires
            })
        }
    }

    return {dntNotSet, updateDNT}
}

export default useDNT
