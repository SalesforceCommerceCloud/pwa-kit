/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useCustomQuery} from '@salesforce/commerce-sdk-react'

import Json from '../components/Json'

const UseCustomEndpoint = () => {
    const query = useCustomQuery({
        options: {
            method: 'GET',
            customApiPathParameters: {
                endpointPath: 'test-hello-world',
                apiName: 'hello-world'
            }
        },
        rawResponse: false
    })
    return <Json data={query.data} />
}

UseCustomEndpoint.getTemplateName = () => 'UseCustomEndpoint'

export default UseCustomEndpoint
