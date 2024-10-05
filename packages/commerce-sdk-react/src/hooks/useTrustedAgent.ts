/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import useAuthContext from './useAuthContext'
import useConfig from './useConfig'
import { useAuthHelper, AuthHelpers } from './useAuthHelper'
import Cookies from 'js-cookie'
import { UseMutationResult } from '@tanstack/react-query'
import { ShopperLoginTypes } from 'commerce-sdk-isomorphic'

const onClient = typeof window !== 'undefined'

type TokenResponse = ShopperLoginTypes.TokenResponse

type UseTrustedAgent = {
    isAgent: boolean
    agentId: string | null
    loginId: string | null
    login: (loginId?: string, usid?: string) => Promise<TokenResponse>
    logout: () => Promise<TokenResponse>
}

type AuthorizationTrustedAgent = UseMutationResult<{url: string, codeVerifier: string}, unknown, {loginId?: string}, unknown>

type LoginTrustedAgent = UseMutationResult<TokenResponse, unknown, {
    // agentId: string
    loginId?: string
    code: string
    codeVerifier: string
    usid?: string
    clientSecret?: string
}, unknown>

type LogoutTrustedAgent = UseMutationResult<TokenResponse, unknown, void, unknown>

const createTrustedAgentPopup = async (url: string, siteId: string): Promise<string> => {
    const popup = window.open(url, 'accountManagerPopup', "popup=true,width=800,height=800,scrollbars=false,status=false,location=false,menubar=false,toolbar=false")
    return new Promise((resolve, reject) => {
        let intervalId: NodeJS.Timer
        intervalId = setInterval(function() {
            console.log('Waiting for code cookie ...')
            if (Cookies.get(`cc-ta-code_${siteId}`) || !popup || popup?.closed) {
                clearInterval(intervalId)
                resolve(Cookies.get(`cc-ta-code_${siteId}`) || '')
            }
        }, 1000)
    })
}

const createTrustedAgentLogin = (authorizeTrustedAgent: AuthorizationTrustedAgent, loginTrustedAgent: LoginTrustedAgent, siteId: string)  => {
    return async (/*agentId: string, */loginId?: string, usid?: string): Promise<TokenResponse> => {
        const {url, codeVerifier} = await authorizeTrustedAgent.mutateAsync({loginId})
        const code = await createTrustedAgentPopup(url, siteId)
        return await loginTrustedAgent.mutateAsync({loginId, /*agentId,*/ code, codeVerifier, usid})
    }
}

const createTrustedAgentLogout = (logoutTrustedAgent: LogoutTrustedAgent)  => {
    return async (): Promise<TokenResponse> => {
        return await logoutTrustedAgent.mutateAsync()
    }
}

/**
 * A hook to return agent status.
 *
 * @group Helpers
 * @category Shopper Authentication
 *
 */
const useTrustedAgent = (): UseTrustedAgent => {
    const auth = useAuthContext()
    const config = useConfig()
    const authorizeTrustedAgent = useAuthHelper(AuthHelpers.AuthorizeTrustedAgent)
    const loginTrustedAgent = useAuthHelper(AuthHelpers.LoginTrustedAgent)
    const logoutTrustedAgent = useAuthHelper(AuthHelpers.Logout)
    const login = createTrustedAgentLogin(authorizeTrustedAgent, loginTrustedAgent, config.siteId)
    const logout = createTrustedAgentLogout(logoutTrustedAgent)

    if (onClient) {
        try {
            const {isAgent, agentId, loginId} = auth.parseSlasJWT(auth.get('access_token'))
            return {isAgent, agentId, loginId, login, logout}
        } catch(e) { /* nada */ }
    }

    return {isAgent: false, agentId: null, loginId: null, login, logout}
}

export default useTrustedAgent
