/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import {useState, useEffect, useCallback} from 'react'
import {useMutation} from '@tanstack/react-query'
import useAuthContext from './useAuthContext'
import {ShopperLoginTypes} from 'commerce-sdk-isomorphic'
import {onClient} from '../utils'

type TokenResponse = ShopperLoginTypes.TokenResponse
type UseTrustedAgent = {
    isAgent: boolean
    agentId: string | null
    loginId: string | null
    login: (loginId?: string, usid?: string) => Promise<TokenResponse>
    logout: () => Promise<TokenResponse>
}

let popup: Window | null
let intervalId: NodeJS.Timer

const getCodeAndStateValueFromPopup = (
    popup: Window | null
): {code: string | null; state: string | null} => {
    let code = null
    let state = null

    try {
        const url = new URL(popup?.location?.toString() || 'http://localhost')
        code = url.searchParams.get('code')
        state = url.searchParams.get('state')
    } catch (e) {
        /* here to catch invalid URL or crossdomain popup access errors */
    }

    return {code, state}
}

export const createTrustedAgentPopup = async (
    url: string,
    isRefresh = false,
    timeoutMinutes = 5,
    refreshTimeoutFocusMinutes = 1
): Promise<{code: string; state: string}> => {
    // if a popup already exists, close it
    if (popup) {
        popup?.close()
    }

    // if a timer already exists, clear it
    if (intervalId) {
        clearTimeout(intervalId)
    }

    // create our popup
    popup =
        window?.open?.(
            url,
            'accountManagerPopup',
            'popup=true,width=800,height=800,scrollbars=false,status=false,location=false,menubar=false,toolbar=false'
        ) || null

    // if this is intended to be a behind the
    // scenes refresh call, make sure our main
    // window stays focused
    if (isRefresh) {
        window?.focus?.()
    }

    const startTime = Date.now()

    return new Promise((resolve, reject) => {
        const checkPopupState = () => {
            const popupCouldntInitialize = !popup
            if (popupCouldntInitialize) {
                clearTimeout(intervalId)
                return reject("Popup couldn't initialize. Check your popup blocker.")
            }

            // success state
            const {code, state} = getCodeAndStateValueFromPopup(popup)
            if (code && state) {
                clearTimeout(intervalId)
                popup?.close()
                return resolve({code, state})
            }

            const popupClosedWithoutAuthenticating = popup?.closed
            if (popupClosedWithoutAuthenticating) {
                clearTimeout(intervalId)
                return reject('Popup closed without authenticating.')
            }

            const popupTimeoutOccurred =
                Math.floor(Date.now() - startTime) > timeoutMinutes * 1000 * 60
            if (popupTimeoutOccurred) {
                clearTimeout(intervalId)
                popup?.close()
                return reject(`Popup timed out after ${timeoutMinutes} minutes.`)
            }

            // if our refresh flow is stuck, focus the popup window
            const popupRefreshTimeoutOccurred =
                Math.floor(Date.now() - startTime) > refreshTimeoutFocusMinutes * 1000 * 60
            if (isRefresh && popupRefreshTimeoutOccurred) {
                popup?.focus()
            }
        }

        checkPopupState()
        intervalId = setInterval(checkPopupState, 1000)
    })
}

/**
 * A hook to return trusted agent state.
 *
 * @group Helpers
 * @category Shopper Authentication
 *
 */
const useTrustedAgent = (): UseTrustedAgent => {
    const auth = useAuthContext()
    const [isAgent, setIsAgent] = useState(false)
    const [agentId, setAgentId] = useState('')
    const [loginId, setLoginId] = useState('')

    const authorizeTrustedAgent = useMutation(auth.authorizeTrustedAgent.bind(auth))
    const loginTrustedAgent = useMutation(auth.loginTrustedAgent.bind(auth))
    const logoutTrustedAgent = useMutation(auth.logout.bind(auth))

    const login = useCallback(
        async (loginId?: string, usid?: string, refresh = false): Promise<TokenResponse> => {
            if (!onClient()) {
                throw new Error(
                    'Something went wrong, this client side method is invoked on the server.'
                )
            }

            const {url, codeVerifier} = await authorizeTrustedAgent.mutateAsync({loginId})
            const {code, state} = await createTrustedAgentPopup(url, refresh)
            return await loginTrustedAgent.mutateAsync({
                loginId,
                code,
                codeVerifier,
                state,
                usid
            })
        },
        [auth]
    )

    const logout = useCallback(async () => {
        return await logoutTrustedAgent.mutateAsync()
    }, [auth])

    useEffect(() => {
        auth.registerTrustedAgentRefreshHandler(login)
    }, [auth])

    useEffect(() => {
        try {
            const {isAgent, agentId, loginId} = auth.parseSlasJWT(auth.get('access_token'))
            setIsAgent(isAgent)
            setAgentId(agentId || '')
            setLoginId(loginId)
        } catch (e) {
            /* here to catch invalid jwt errors */
        }
    }, [auth.get('access_token')])

    return {isAgent, agentId, loginId, login, logout}
}

export default useTrustedAgent
