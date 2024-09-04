/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState} from 'react'
import useAuthContext from './useAuthContext'
import useConfig from './useConfig'
import {getDefaultCookieAttributes} from '../utils'
import Cookies from 'js-cookie'

interface useDntReturn {
    dntNotSet: boolean
    updateDNT: (preference: boolean | null) => Promise<void>
}

/**
 * Hook that returns
 * dntNotSet - a boolean indicating that the dw_dnt cookie was not correctly defined
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
    const dwDntValue = Cookies.get('dw_dnt')

    const isDntCookieNotDefined = dwDntValue !== '1' && dwDntValue !== '0'
    const [dntNotSet, setDntNotSet] = useState(isDntCookieNotDefined)

    const updateDNT = async (preference: boolean | null) => {
        let dntCookieVal = String(Number(preference))
        // Use defaultDNT if defined. If not, use SLAS default DNT
        if (preference === null) {
            dntCookieVal = config.defaultDnt ? String(Number(config.defaultDnt)) : '0'
        }
        // Set the cookie once to include dnt in the access token and then again to set the expiry time
        Cookies.set('dw_dnt', dntCookieVal, {
            ...getDefaultCookieAttributes(),
            secure: true
        })
        setDntNotSet(false)
        await auth.refreshAccessToken()

        if (preference !== null) {
            const daysUntilExpires = Number(auth.get('refresh_token_expires_in')) / 86400
            Cookies.set('dw_dnt', dntCookieVal, {
                ...getDefaultCookieAttributes(),
                secure: true,
                expires: daysUntilExpires
            })
        }
    }

    return {dntNotSet, updateDNT}
}

export default useDNT
