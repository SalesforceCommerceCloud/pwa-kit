/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState} from 'react'
//@ts-ignore
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'

const Home = () => {
    const [token, setToken] = useState('')

    return (
        <div>
            <div>
                <a
                    href="https://dro000000bdrl2ao.test1.my.pc-rnd.salesforce.com/services/oauth2/authorize?
client_id=3MVG9sA57VMGPDfccCqclI6RJtAtX8wWWhlw31HVV7dAXKQrDd03vlapy1jQNtNJxdr_7VimdE1yefXDvrv2o&
redirect_uri=https://localhost:3000&
response_type=code"
                >
                    Login
                </a>
                <button
                    onClick={async () => {
                        const params = new URLSearchParams(window.location.search)
                        const code: string = params.get('code') || ''
                        const res = await fetch(
                            `${getAppOrigin()}/mobify/proxy/scom/services/oauth2/token`,
                            {
                                method: 'post',
                                body: JSON.stringify({
                                    'Content-type': 'application/x-www-form-urlencoded',
                                    code: decodeURI(code),
                                    grant_type: 'authorization_code',
                                    client_id:
                                        '3MVG9sA57VMGPDfccCqclI6RJtAtX8wWWhlw31HVV7dAXKQrDd03vlapy1jQNtNJxdr_7VimdE1yefXDvrv2o',
                                    client_secret:
                                        '262C3081284DA4CCBC1B6CCA9DDA4F10C746C46CD5752D7C30D0AE5A104CD7B2'
                                })
                            }
                        )
                        console.log('res', res)
                    }}
                >
                    Get the token
                </button>
            </div>
        </div>
    )
}

Home.getTemplateName = () => 'home'

export default Home
