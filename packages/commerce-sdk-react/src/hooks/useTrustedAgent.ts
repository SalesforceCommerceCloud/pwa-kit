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

type useTrustedAgent = {
    isAgent: boolean
    agentId: string | null
    loginId: string | null
    handleTrustedAgentLogin: (loginId: string, agentId: string) => Promise<void>
}

const createPopup = async (url: string, siteId: string): Promise<string> => {
    const popup = window.open(url, 'accountManagerPopup', "popup=true,width=500,height=400,scrollbars=false,status=false,location=false,menubar=false,toolbar=false")
    return new Promise((resolve, reject) => {
        let intervalId: NodeJS.Timer
        intervalId = setInterval(function() {
            console.log('Waiting for code cookie ...')
            if (Cookies.get(`cc-ta-code_${siteId}`) || popup?.closed) {
                clearInterval(intervalId)
                resolve(Cookies.get(`cc-ta-code_${siteId}`) || '')
            }
        }, 1000)
    })
}

export const createHandleTrustedAgentLogin = (authorizeTrustedAgent: UseMutationResult, loginTrustedAgent: UseMutationResult, siteId: string): (loginId: string, agentId: string) => Promise<string>  => {
    return async (loginId: string, agentId: string): Promise<string> => {
        const {redirectUrl, codeVerifier} = /*<Promise<{redirectUrl: string, codeVerifier: string}>>*/await authorizeTrustedAgent.mutateAsync({loginId, agentId})
        const code = await createPopup(redirectUrl, siteId)
        return /*<Promise<string>>*/await loginTrustedAgent.mutateAsync({loginId, agentId, code, codeVerifier})
    }
}

/**
 * A hook to return agent status.
 *
 * @group Helpers
 * @category Shopper Authentication
 *
 */
const useTrustedAgent = (): useTrustedAgent => {
    const auth = useAuthContext()
    const config = useConfig()
    const authorizeTrustedAgent = useAuthHelper(AuthHelpers.AuthorizeTrustedAgent)
    const loginTrustedAgent = useAuthHelper(AuthHelpers.LoginTrustedAgent)
    const handleTrustedAgentLogin = createHandleTrustedAgentLogin(authorizeTrustedAgent, loginTrustedAgent, config.siteId)

    try {
        const {isAgent, agentId, loginId} = auth.parseSlasJWT(auth.get('access_token'))
        return {isAgent, agentId, loginId, handleTrustedAgentLogin}
    } catch(e) { /* nada */}

    return {isAgent: false, agentId: null, loginId: null, handleTrustedAgentLogin}
}

export default useTrustedAgent
