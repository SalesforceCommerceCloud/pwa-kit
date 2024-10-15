/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect, useCallback} from 'react'
import {useMutation} from '@tanstack/react-query'
import useAuthContext from './useAuthContext'
import {ShopperLoginTypes} from 'commerce-sdk-isomorphic'
import type Auth from '../auth'

type TokenResponse = ShopperLoginTypes.TokenResponse
type UseTrustedAgent = {isAgent: boolean, agentId: string | null, loginId: string | null, login: (loginId?: string, usid?: string) => Promise<TokenResponse>, logout: () => Promise<TokenResponse>}

let popup: Window | null
let intervalId: NodeJS.Timer

const getCodeAndStateValueFromPopup = (popup: Window | null): {code: string | null, state: string | null} => {
    let code = null
    let state = null

    try {
        const url  = new URL(popup?.location?.toString() || 'http://localhost')
        code = url.searchParams.get('code')
        state = url.searchParams.get('state')
    } catch (e) { /* here to catch invalid URL or crossdomain popup access errors */ }

    return {code, state}
}

const createTrustedAgentPopup = async (url: string, isRefresh: boolean = false, timeoutMinutes: number = 5, refreshTimeoutFocusMinutes: number = 1): Promise<{code: string, state: string}> => {
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
        console.log('useTrustedAgent setInterval')
        intervalId = setInterval(() => {
            console.log('useTrustedAgent interval tick')
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

            const popupClosedWithoutAuthenicating = popup?.closed
            if (popupClosedWithoutAuthenicating) {
                clearTimeout(intervalId)
                return reject('Popup closed without authenticating.')
            }

            const popupTimeoutOccurred = Math.floor(Date.now() - startTime) > (timeoutMinutes * 1000 * 60)
            if (popupTimeoutOccurred) {
                clearTimeout(intervalId)
                popup?.close()
                return reject(`Popup timed out after ${timeoutMinutes} minutes.`)
            }

            // if our refresh flow is stuck, focus the popup window
            const popupRefreshTimeoutOccurred = Math.floor(Date.now() - startTime) > (refreshTimeoutFocusMinutes * 1000 * 60)
            if (isRefresh && popupRefreshTimeoutOccurred) {
                popup?.focus()
            }
        }, 1000)
    })
}

const createTrustedAgentLogin = (auth: Auth)  => {
    console.log('useTrustedAgent createTrustedAgentLogin()')
    const authorizeTrustedAgent = useMutation(auth.authorizeTrustedAgent.bind(auth))
    const loginTrustedAgent = useMutation(auth.loginTrustedAgent.bind(auth))
    return async (loginId?: string, usid?: string, refresh: boolean = false): Promise<TokenResponse> => {
        const {url, codeVerifier} = await authorizeTrustedAgent.mutateAsync({loginId})
        console.log('useTrustedAgent createTrustedAgentPopup')
        const {code, state} = await createTrustedAgentPopup(url, refresh)
        console.log('useTrustedAgent auth.loginTrustedAgent()')
        return await loginTrustedAgent.mutateAsync({loginId, code, codeVerifier, state, usid})
    }
}

const createTrustedAgentLogout = (auth: Auth)  => {
    console.log('useTrustedAgent createTrustedAgentLogout()')
    const logoutTrustedAgent = useMutation(auth.logout.bind(auth))
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
    const auth = useAuthContext()
    const [isAgent, setIsAgent] = useState(false)
    const [agentId, setAgentId] = useState('')
    const [loginId, setLoginId] = useState('')

    const login = useCallback(createTrustedAgentLogin(auth), [auth])
    const logout = useCallback(createTrustedAgentLogout(auth), [auth])
    useEffect(() => {
        console.log('useTrustedAgent auth.registerTrustedAgentRefreshHandler()')
        auth.registerTrustedAgentRefreshHandler(login)
    }, [auth])

    useEffect(() => {
        console.log('useTrustedAgent auth.parseSlasJWT()')
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
