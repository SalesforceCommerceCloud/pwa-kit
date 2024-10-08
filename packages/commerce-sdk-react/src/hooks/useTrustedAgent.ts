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
import useConfig from './useConfig'
import { ShopperLoginTypes } from 'commerce-sdk-isomorphic'

type TokenResponse = ShopperLoginTypes.TokenResponse
type UseTrustedAgent = {isAgent: boolean, agentId: string | null, loginId: string | null, login: (loginId?: string, usid?: string) => Promise<TokenResponse>, logout: () => Promise<TokenResponse>}
type AuthorizationTrustedAgent = UseMutationResult<{url: string, codeVerifier: string}, unknown, {loginId?: string}, unknown>
type LoginTrustedAgent = UseMutationResult<TokenResponse, unknown, {loginId?: string, code: string, codeVerifier: string, usid?: string, clientSecret?: string}, unknown>
type LogoutTrustedAgent = UseMutationResult<TokenResponse, unknown, void, unknown>

let popup: Window | null
let intervalId: NodeJS.Timer

const createTrustedAgentPopup = async (url: string, siteId: string, isRefresh: boolean = false, timeoutMinutes: number = 2, refreshTimeoutFocusMinutes: number = 0.25): Promise<string> => {
    if (popup) popup.close()
    if (intervalId) clearTimeout(intervalId)

    popup = window.open(url, 'accountManagerPopup', "popup=true,width=800,height=800,scrollbars=false,status=false,location=false,menubar=false,toolbar=false")

    // if this is intended to be a behind the scenes refresh
    // call, make sure our main window stays focused
    if (isRefresh) {
        console.log('IS REFRESH')
        window.focus()
    }

    let startTime = Date.now() / 1000

    return new Promise((resolve, reject) => {
        intervalId = setInterval(function() {
            console.log('useTrustedAgent cookie check internval')
            const cookieValue = Cookies.get(`cc-ta-code_${siteId}`)
            const popupCouldntInitialize = !popup
            const popupClosedWithoutAuthenicating = popup?.closed && !cookieValue
            const popupTimeoutOccurred = Math.floor(Date.now() / 1000 - startTime) > timeoutMinutes * 60

            popupCouldntInitialize && (clearTimeout(intervalId), reject(`Popup couldn't initialize.`))
            popupClosedWithoutAuthenicating && (clearTimeout(intervalId), reject(`Popup closed without authenticating.`))
            popupTimeoutOccurred && (clearTimeout(intervalId), reject(`Popup timed out after ${timeoutMinutes} minutes.`))
            cookieValue && (clearTimeout(intervalId), resolve(cookieValue || ''))

            if (Date.now() - startTime > refreshTimeoutFocusMinutes * 60) {
                popup?.focus()
            }
        }, 1000)
    })
}

const createTrustedAgentLogin = (authorizeTrustedAgent: AuthorizationTrustedAgent, loginTrustedAgent: LoginTrustedAgent, siteId: string)  => {
    return async (loginId?: string, usid?: string, refresh: boolean = false): Promise<TokenResponse> => {
        console.log('useTrustedAgent auth.authorizeTrustedAgent()')
        const {url, codeVerifier} = await authorizeTrustedAgent.mutateAsync({loginId})
        console.log('useTrustedAgent createTrustedAgentPopup')
        const code = await createTrustedAgentPopup(url, siteId, refresh)
        console.log('useTrustedAgent auth.loginTrustedAgent()')
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
    const config = useConfig()
    const auth = useAuthContext()

    // TODO: TAOB should i use useCallback here?
    const login = createTrustedAgentLogin(useMutation(auth.authorizeTrustedAgent.bind(auth)), useMutation(auth.loginTrustedAgent.bind(auth)), config.siteId)
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
