/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect, useCallback} from 'react'
import Cookies from 'js-cookie'
import { useMutation, UseMutationResult } from '@tanstack/react-query'
import useAuthContext from './useAuthContext'
import { ShopperLoginTypes } from 'commerce-sdk-isomorphic'

type TokenResponse = ShopperLoginTypes.TokenResponse
type UseTrustedAgent = {isAgent: boolean, agentId: string | null, loginId: string | null, login: (loginId?: string, usid?: string) => Promise<TokenResponse>, logout: () => Promise<TokenResponse>}
type AuthorizationTrustedAgent = UseMutationResult<{url: string, codeVerifier: string}, unknown, {loginId?: string}, unknown>
type LoginTrustedAgent = UseMutationResult<TokenResponse, unknown, {loginId?: string, code: string, codeVerifier: string, usid?: string, clientSecret?: string}, unknown>
type LogoutTrustedAgent = UseMutationResult<TokenResponse, unknown, void, unknown>

let popup: Window | null
let intervalId: NodeJS.Timer

const getCodeValueFromPopup = (popup: Window | null): string | null => {
    let codeValue = null

    try {
        codeValue = new URL(popup?.location?.toString() || 'http://localhost').searchParams.get('code')
    } catch (e) { /* do nothing */ }

    return codeValue
}

const createTrustedAgentPopup = async (url: string, isRefresh: boolean = false, timeoutMinutes: number = 3, refreshTimeoutFocusMinutes: number = 1): Promise<string> => {
    // if a popup already exists, close it
    if (popup) {
        popup.close()
    }

    // if a timer already exists, clear it
    if (intervalId) {
        clearTimeout(intervalId)
    }

    // create our popup
    popup = window.open(url, 'accountManagerPopup', "popup=true,width=800,height=800,scrollbars=false,status=false,location=false,menubar=false,toolbar=false")

    // if this is intended to be a behind the
    // scenes refresh call, make sure our main
    // window stays focused
    if (isRefresh) {
        window.focus()
    }

    let startTime = Date.now()

    return new Promise((resolve, reject) => {
        intervalId = setInterval(() => {
            const popupCouldntInitialize = !popup
            if (popupCouldntInitialize) {
                clearTimeout(intervalId)
                return reject(`Popup couldn't initialize. Check your popup blocker.`)
            }

            const popupTimeoutOccurred = Math.floor(Date.now() - startTime) > (timeoutMinutes * 1000 * 60)
            if (popupTimeoutOccurred) {
                clearTimeout(intervalId)
                popup?.close()
                return reject(`Popup timed out after ${timeoutMinutes} minutes.`)
            }

            const codeValue = getCodeValueFromPopup(popup)

            const popupClosedWithoutAuthenicating = popup?.closed && !codeValue
            if (popupClosedWithoutAuthenicating) {
                clearTimeout(intervalId)
                return reject(`Popup closed without authenticating`)
            }

            // success state
            if (codeValue && codeValue !== '') {
                clearTimeout(intervalId)
                popup?.close()
                return resolve(codeValue)
            }

            // if our refresh flow is stuck, focus the window
            const popupRefreshTimeoutOccurred = Math.floor(Date.now() - startTime) > (refreshTimeoutFocusMinutes * 1000 * 60)
            if (isRefresh && popupRefreshTimeoutOccurred) {
                popup?.focus()
            }
        }, 1000)
    })
}

const createTrustedAgentLogin = (authorizeTrustedAgent: AuthorizationTrustedAgent, loginTrustedAgent: LoginTrustedAgent)  => {
    return async (loginId?: string, usid?: string, refresh: boolean = false): Promise<TokenResponse> => {
        const {url, codeVerifier} = await authorizeTrustedAgent.mutateAsync({loginId})
        const code = await createTrustedAgentPopup(url, refresh)
        return await loginTrustedAgent.mutateAsync({loginId, code, codeVerifier, usid})
    }
}

const createTrustedAgentLogout = (logoutTrustedAgent: LogoutTrustedAgent)  => {
    return async (): Promise<TokenResponse> => {
        console.log('useTrustedAgent auth.logout()')
        return await logoutTrustedAgent.mutateAsync()
    }
}

/**
 * A hook to return trusted agent state.
 *
 * @group Helpers
 * @category Shopper Authentication
 *
 */
const useTrustedAgent = (): UseTrustedAgent => {
    const [isAgent, setIsAgent] = useState(false)
    const [agentId, setAgentId] = useState('')
    const [loginId, setLoginId] = useState('')
    const auth = useAuthContext()

    // TODO: TAOB should i use useCallback here?
    const login = createTrustedAgentLogin(useMutation(auth.authorizeTrustedAgent.bind(auth)), useMutation(auth.loginTrustedAgent.bind(auth)))
    const logout = createTrustedAgentLogout(useMutation(auth.logout.bind(auth)))

    // TODO: TAOB do we even need this to be in a useEffect?
    useEffect(() => {
        auth.registerTrustedAgentRefreshHandler(login)
    }, [auth])

    useEffect(() => {
        try {
            const {isAgent, agentId, loginId} = auth.parseSlasJWT(auth.get('access_token'))
            setIsAgent(isAgent)
            setAgentId(agentId || '')
            setLoginId(loginId)
        } catch(e) { /* here to catch invalid jwt errors */ }
    }, [auth.get('access_token')])

    return {isAgent, agentId, loginId, login, logout}
}

export default useTrustedAgent
