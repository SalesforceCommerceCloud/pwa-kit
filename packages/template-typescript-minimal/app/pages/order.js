/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {useOrders} from '../hooks/useFetch'

Order.propTypes = {}

function Order(props) {
    return (
        <div>
            ORder
            <div>
                {/*{addresses?.items.length > 0 && (*/}
                {/*    <div style={{display: 'flex', justifyContent: 'flex-start', gap: '10px'}}>*/}
                {/*        {addresses?.items.map((a) => (*/}
                {/*            <Address address={a} key={a.addressId} accountId={cart.accountId} />*/}
                {/*        ))}*/}
                {/*    </div>*/}
                {/*)}*/}
                {/*<button*/}
                {/*    onClick={() => {*/}
                {/*        const id = Math.floor(Math.random() * 100)*/}
                {/*        addNewAddressAction.mutate({*/}
                {/*            payload: {*/}
                {/*                city: 'Vancouver',*/}
                {/*                country: 'CA',*/}
                {/*                addressType: 'Shipping',*/}
                {/*                isDefault: true,*/}
                {/*                name: `Alex Vuong ${id}`,*/}
                {/*                postalCode: '01234',*/}
                {/*                region: 'BC',*/}
                {/*                street: '123 Main Street'*/}
                {/*            },*/}
                {/*            accountId: cart.accountId*/}
                {/*        })*/}
                {/*    }}*/}
                {/*>*/}
                {/*    Create a dummy address*/}
                {/*</button>*/}
            </div>
        </div>
    )
}

export default Order
