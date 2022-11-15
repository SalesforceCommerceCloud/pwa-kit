/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {
    useAddressAction,
    useCart,
    useCheckout,
    useCheckoutAction,
    useUserAddresses
} from '../hooks/useFetch'
import {useQueryClient} from '@tanstack/react-query'

Checkout.propTypes = {}

const Address = ({address, accountId}) => {
    const addNewAddressAction = useAddressAction(accountId)
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
            {/*<button*/}
            {/*    onClick={() => {*/}
            {/*        addNewAddressAction.mutate({*/}
            {/*            payload: {*/}
            {/*                addressId: address.addressId*/}
            {/*            },*/}
            {/*            fetchOptions: {*/}
            {/*                method: 'PATCH'*/}
            {/*            }*/}
            {/*        })*/}
            {/*    }}*/}
            {/*>*/}
            {/*    Delete*/}
            {/*</button>*/}
        </div>
    )
}

function Checkout() {
    const {data: cart, isLoading: isCartLoading} = useCart()
    const {data: checkoutData, isLoading: isCheckoutLoading} = useCheckout()
    console.log('checkoutData', checkoutData)
    const {data: addresses, isLoading: isAddressesLoading} = useUserAddresses(cart?.accountId)
    const addNewAddressAction = useAddressAction(cart?.accountId)
    const checkoutAction = useCheckoutAction(checkoutData?.checkoutId)

    const [selectedCarrier, setSelectedCarrier] = React.useState(null)

    React.useEffect(() => {
        // if this happens, it means there is no active checkouts, create one
        if (checkoutData?.[0]?.errorCode) {
            console.log('===checkout not found=====')
            checkoutAction.mutate({
                payload: {
                    cartId: cart.cartId
                }
            })
        }

        const selectedCarrier = checkoutData?.deliveryGroups?.items?.[0].selectedDeliveryMethod
        setSelectedCarrier(selectedCarrier)
        console.log('selectedCarrier', selectedCarrier)
    }, [])
    React.useEffect(() => {
        const selectedCarrier = checkoutData?.deliveryGroups?.items?.[0].selectedDeliveryMethod
        setSelectedCarrier(selectedCarrier)
        console.log('selectedCarrier', selectedCarrier)
    }, [checkoutData])
    if (isAddressesLoading || isCheckoutLoading || isCartLoading) {
        return <div>Loading...</div>
    }

    const {deliveryGroups} = checkoutData
    return (
        <div>
            <div>
                <div>
                    <h3>Shipping Address</h3>
                    <div>
                        It is possible to edit and add new addresses, but it is omited in this page
                        to avoid complication
                    </div>
                    <div style={{display: 'flex', justifyContent: 'flex-start', gap: '10px'}}>
                        {deliveryGroups?.items.map((i) => {
                            const {deliveryAddress} = i
                            console.log('deliveryAddress', deliveryAddress)
                            return (
                                <Address
                                    address={deliveryAddress}
                                    accountId={cart.accountId}
                                    key={deliveryAddress.name}
                                />
                            )
                        })}
                    </div>
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
                <div>
                    <h3>Shipping method</h3>

                    <div>
                        {deliveryGroups?.items.map((i) => {
                            return (
                                <div key={i.id}>
                                    {i.availableDeliveryMethods.map((method) => (
                                        <RadioButton
                                            key={method.id}
                                            value={method.id}
                                            isSelected={method.id === selectedCarrier?.id}
                                            label={method.name}
                                            onChange={(e) => {
                                                const t = checkoutData?.deliveryGroups?.items?.[0].availableDeliveryMethods.find(
                                                    (method) => method.id === e.target.value
                                                )
                                                setSelectedCarrier(t)
                                                checkoutAction.mutate({
                                                    payload: {
                                                        deliveryMethodId: e.target.value
                                                    },
                                                    fetchOptions: {
                                                        method: 'PATCH'
                                                    }
                                                })
                                            }}
                                        />
                                    ))}
                                </div>
                            )
                        })}
                    </div>
                </div>

                <div>
                    <h3>
                        Payment (dummy card is filled in for you!). There is no api validating the
                        card after finishing filling out the card info
                    </h3>
                    <div style={{display: 'flex', flexDirection: 'column', gap: '10px'}}>
                        <label htmlFor="">
                            Card number : <input type="text" disabled value="4242 4242 4242 4242" />
                        </label>
                        <label htmlFor="">
                            Card Holder Name : <input type="text" disabled value="Alex Vuong" />
                        </label>
                        <label htmlFor="">
                            Expire date : <input type="text" disabled value="08/28" />
                        </label>
                        <label htmlFor="">
                            CVC <input type="text" disabled value="123" />
                        </label>
                    </div>
                </div>

                <button style={{marginTop: '20px'}}>Place Order</button>
            </div>
        </div>
    )
}

const RadioButton = ({label, value, onChange, isSelected}) => {
    return (
        <label>
            <input type="radio" checked={isSelected} value={value} onChange={onChange} />
            {label}
        </label>
    )
}

export default Checkout
