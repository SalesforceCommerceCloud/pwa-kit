/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import {useAddressAction, useUserAddresses} from '../hooks/useFetch'
import Address from '../components/address'

function Addresses() {
    const {data: shippingAddresses} = useUserAddresses()
    const {data: billingAddresses} = useUserAddresses('current', {addressType: 'billing'})
    const addressesActions = useAddressAction()

    return (
        <div>
            <div> Form filling is omit to reduce complexity on client side</div>
            <div> It is possible to edit/add/remove an address via the APIs</div>
            <button
                onClick={() => {
                    const id = Math.floor(Math.random() * 100)
                    addressesActions.mutate({
                        payload: {
                            city: 'Vancouver',
                            country: 'CA',
                            addressType: 'Shipping',
                            isDefault: true,
                            name: `Alex Vuong ${id}`,
                            postalCode: '01234',
                            region: 'BC',
                            street: '123 Main Street'
                        },
                        accountId: 'current'
                    })
                }}
            >
                Create a dummy shipping address
            </button>
            <h3>Shipping Addresses</h3>
            {shippingAddresses?.items.length === 0 && 'No Shipping addresses'}
            {shippingAddresses?.items.length > 0 && (
                <div style={{display: 'flex', justifyContent: 'flex-start', gap: '10px'}}>
                    {shippingAddresses?.items.map((a) => (
                        <Address address={a} key={a.addressId} accountId={a.addressId} />
                    ))}
                </div>
            )}

            <h3>Billing Addresses</h3>
            {billingAddresses?.items.length === 0
                ? 'no billing'
                : billingAddresses?.items.map((a) => (
                      <Address address={a} key={a.addressId} accountId={a.addressId} />
                  ))}
        </div>
    )
}

export default Addresses
