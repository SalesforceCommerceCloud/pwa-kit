/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {getApiUrl, useAddressAction} from '../hooks/useFetch'

const Address = ({address}) => {
    const addressesActions = useAddressAction()
    if (!address) return null
    return (
        <div
            style={{
                border: '1px solid black',
                borderRadius: '10px',
                padding: '20px'
            }}
        >
            <div>isDefault: {address.isDefault ? 'Yes' : 'No'}</div>
            <div>{address.name}</div>
            <div>{`${address.street}, ${address.city}`}</div>
            <div>{`${address.region}, ${address.country}`}</div>
            <button
                onClick={() => {
                    addressesActions.mutate({
                        url: getApiUrl(`/accounts/current/addresses/${address.addressId}`),
                        fetchOptions: {
                            method: 'DELETE'
                        }
                    })
                }}
            >
                Delete
            </button>
        </div>
    )
}

export default Address
