/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/*
 * Copyright (c) 2021-2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {createContext, useContext, useEffect} from 'react'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'

export const BuyerContext = createContext({})
export const BuyerProvider = BuyerContext.Provider

export default function useBuyer() {
    const {token, setToken} = useContext(BuyerContext)

    const getToken = async () => {
        console.log('fetch')
        const response = await fetch(`${getAppOrigin()}/mobify/proxy/scom/services/Soap/c/55.0`, {
            method: 'POST',
            headers: {
                'Content-Type': 'text/xml',
                SOAPAction: 'login'
            },
            body: `<?xml version="1.0" encoding="utf-8"?>
                <soap:Envelope
                xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/"
                xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
                xmlns:xsd="http://www.w3.org/2001/XMLSchema">
                    <soap:Header>
                        <LoginScopeHeader xmlns="urn:enterprise.soap.sforce.com">
                            <organizationId>00DRO000000BH4w</organizationId>
                        </LoginScopeHeader>
                    </soap:Header>
                    <soap:Body>
                        <login xmlns="urn:enterprise.soap.sforce.com">
                            <username>alex.vuong@salesforce.com</username>
                            <password>Test1234!</password>
                        </login>
                    </soap:Body>
                </soap:Envelope>`
        })
        const body = await response.text()
        const token = /<sessionId>(.*)<\/sessionId>/.exec(body)[1]
        setToken(token)
    }

    return [token, getToken]
}
