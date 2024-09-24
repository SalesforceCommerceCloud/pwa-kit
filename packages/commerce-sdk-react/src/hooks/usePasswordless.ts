/*
 * Copyright (c) 2024, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect} from 'react'
import useAuthContext from './useAuthContext'
import useEncUserId from './useEncUserId'
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
const usePasswordless = () => {
    const auth = useAuthContext()
    const {getEncUserIdWhenReady} = useEncUserId()
    useEffect(() => {
        void (async () => {
            const passwordlessResponse = await auth.passwordlessAuthorize('jangho.jung0@gmail.com')
            console.log("(JEREMY) passwordlessResponse: ", passwordlessResponse)
        })()
    }, [])

    const someFunc = async (input: string) => {
        console.log("(JEREMY) auth: ", auth)
        await auth.getPasswordLessAccessToken(input)
    }
    return {
        getPasswordLessAccessToken: someFunc
    }
}

export default usePasswordless
