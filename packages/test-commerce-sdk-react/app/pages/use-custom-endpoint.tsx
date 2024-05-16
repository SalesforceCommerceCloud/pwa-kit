/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useCustomQuery} from '@salesforce/commerce-sdk-react'
import {Link} from 'react-router-dom'

import Json from '../components/Json'

const CLIENT_ID = '820a9be3-5904-457e-9c76-3115bb41a7f6'
const ORG_ID = 'f_ecom_zzrf_006'
const SHORT_CODE = 'kv7kzm78'
const SITE_ID = 'RefArch'

const UseCustomEndpoint = () => {
    const clientConfig = {
        parameters: {
            clientId: CLIENT_ID,
            siteId: SITE_ID,
            organizationId: ORG_ID,
            shortCode: SHORT_CODE
        },
        proxy: 'http://localhost:3000/mobify/proxy/api'
    }
    const query = useCustomQuery(
        {
            options: {
                method: 'GET',
                customApiPathParameters: {
                    endpointPath: 'test-hello-world',
                    apiName: 'hello-world'
                }
            },
            clientConfig,
            rawResponse: false
        },
        {}
    )
    return <Json data={query.data} />
}

UseCustomEndpoint.getTemplateName = () => 'UseCustomEndpoint'

export default UseCustomEndpoint
