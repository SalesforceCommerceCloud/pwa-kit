/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React from 'react'
import PropTypes from 'prop-types'
import {getAppOrigin} from 'pwa-kit-react-sdk/utils/url'
import {getConfig} from 'pwa-kit-runtime/utils/ssr-config'
import {
    getApiUrl,
    useAddressAction,
    useCart,
    useCheckout,
    useCheckoutAction,
    useUserAddresses
} from '../hooks/useFetch'
import {useHistory} from 'react-router-dom/cjs/react-router-dom'
import {useQueryClient} from '@tanstack/react-query'
import Address from '../components/address'

Checkout.propTypes = {}

function Checkout() {
    const queryClient = useQueryClient()
    const {
        app: {webstoreId}
    } = getConfig()
    const history = useHistory()
    const {data: cart, isLoading: isCartLoading} = useCart()
    const addDeliveryAddress = (checkoutId) => {
        if (!checkoutId) return
        const deliveryAddress = addresses?.items.find((a) => !!a.isDefault) || addresses?.items[0]
        checkoutAction.mutate(
            {
                url: getApiUrl(`/checkouts/${checkoutId}`),
                payload: {
                    deliveryAddress: {
                        id: deliveryAddress?.addressId
                    }
                },
                fetchOptions: {
                    method: 'PATCH'
                }
            },
            {
                onSuccess: (e) => {
                    // manually refetch the checkout to get carrier details after an arbitrary time
                    // because the server needs time to inject available carriers into checkout
                    setTimeout(() => {
                        queryClient.refetchQueries({
                            queryKey: [`/${webstoreId}/checkouts/active`]
                        })
                    }, 2000)
                }
            }
        )
    }
    const {data: checkoutData, isLoading: isCheckoutLoading} = useCheckout(
        'active',
        {},
        {
            onError: (err) => {
                // no checkout availabel, proceed to create one
                if (err.message.includes("We can't find the checkout.")) {
                    checkoutAction.mutate({
                        url: getApiUrl(`/checkouts`),
                        payload: {
                            cartId: cart.cartId
                        }
                    })
                }
            }
        }
    )
    const {data: addresses, isLoading: isAddressesLoading} = useUserAddresses(cart?.accountId, {
        addressType: 'Shipping',
        sortOrder: 'CreatedDateDesc',
        excludeUnsupportedCountries: true
    })
    const checkoutAction = useCheckoutAction(checkoutData?.checkoutId)

    const [selectedCarrier, setSelectedCarrier] = React.useState(null)

    React.useEffect(() => {
        if (!checkoutData?.deliveryGroups?.items[0].deliveryAddress) {
            addDeliveryAddress(checkoutData?.checkoutId)
        }
        const selectedCarrier = checkoutData?.deliveryGroups?.items?.[0].selectedDeliveryMethod
        setSelectedCarrier(selectedCarrier)
    }, [checkoutData])
    if (isAddressesLoading || isCheckoutLoading || isCartLoading) {
        return <div>Loading...</div>
    }

    return (
        <div>
            <div>
                <div>
                    <h3>Shipping Address</h3>
                    <div>
                        It is possible to edit and add new addresses, but it is omitted in this page
                        to avoid complication
                    </div>
                    {checkoutData?.deliveryGroups.items.map((i) => {
                        const {deliveryAddress} = i
                        return (
                            <div
                                key={i.id}
                                style={{display: 'flex', justifyContent: 'flex-start', gap: '10px'}}
                            >
                                <Address address={deliveryAddress} accountId={cart.accountId} />
                            </div>
                        )
                    })}
                </div>
                <div>
                    <h3>
                        Shipping method (if address shows up but no delivery methods, please
                        refresh)
                    </h3>

                    <div>
                        {checkoutData?.deliveryGroups.items.map((i) => {
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
                                                    url: getApiUrl(
                                                        `/checkouts/${checkoutData?.checkoutId}`
                                                    ),
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

                <button
                    onClick={() => {
                        const res = checkoutAction.mutate(
                            {
                                url: getApiUrl(`/payments/token`),
                                payload: {
                                    cardPaymentMethod: {
                                        cardHolderName: 'Alex Vuong',
                                        cardNumber: '4242424242424242',
                                        expiryMonth: '12',
                                        expiryYear: '28',
                                        cvv: '123',
                                        cardType: 'Visa'
                                    }
                                }
                            },
                            {
                                onSuccess: (data) => {
                                    const {token} = data
                                    const address =
                                        checkoutData?.deliveryGroups?.items[0].deliveryAddress
                                    checkoutAction.mutate(
                                        {
                                            url: getApiUrl(`/checkouts/active/payments`),
                                            payload: {
                                                paymentToken: token,
                                                requestType: 'Auth',
                                                billingAddress: address
                                            }
                                        },
                                        {
                                            onSuccess: (data) => {
                                                if (data?.salesforceResultCode === 'Success') {
                                                    history.push('/order/confirmed', {
                                                        checkoutId: checkoutData.checkoutId
                                                    })
                                                }
                                            }
                                        }
                                    )
                                }
                            }
                        )
                    }}
                    style={{marginTop: '20px'}}
                >
                    Place Order
                </button>
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
