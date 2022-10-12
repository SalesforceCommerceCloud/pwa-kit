/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React from 'react'
import Json from '../components/Json'
import {useCustomerAddress} from 'commerce-sdk-react'

const testRegisteredCustomerId = 'abkehFwKoXkbcRmrFIlaYYwKtJ'
const testRegisteredCustomerAddressName = 'TestAddress'
function UseCustomerAddress() {
    const {data, isLoading, error} = useCustomerAddress({
        customerId: testRegisteredCustomerId,
        addressName: testRegisteredCustomerAddressName
    })
    if (isLoading) {
        return (
            <div>
                <h1>useCustomerAddress page</h1>
                <h2 style={{background: 'aqua'}}>Loading...</h2>
            </div>
        )
    }

    if (error) {
        return <h1 style={{color: 'red'}}>Something is wrong</h1>
    }

    return (
        <>
            <h1>useCustomerAddress page</h1>
            <h2>{data?.name}</h2>
            <hr />
            <h3>Returning data</h3>
            <Json data={{isLoading, error, data}} />
        </>
    )
}

UseCustomerAddress.getTemplateName = () => 'UseCustomerAddress'

export default UseCustomerAddress
