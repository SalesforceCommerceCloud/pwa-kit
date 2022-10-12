/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import {useCustomer} from 'commerce-sdk-react'
import Json from '../components/Json'

const testRegisteredCustomerId = 'abkehFwKoXkbcRmrFIlaYYwKtJ'

function UseCustomer() {
    const {data, isLoading, error} = useCustomer({customerId: testRegisteredCustomerId})
    if (isLoading) {
        return (
            <div>
                <h1>useCustomer page</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }

    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }

    return (
        <>
            <h1>useCustomer page</h1>
            <h2>{data?.name}</h2>
            <hr />
            <h3>Returning data</h3>
            <Json data={{isLoading, error, data}} />
        </>
    )
}

UseCustomer.getTemplateName = () => 'UseCustomer'

export default UseCustomer
