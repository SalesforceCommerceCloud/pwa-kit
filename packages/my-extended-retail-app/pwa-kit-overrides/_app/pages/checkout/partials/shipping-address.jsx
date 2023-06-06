/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {nanoid} from 'nanoid'
import {defineMessage, useIntl} from 'react-intl'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {
    ToggleCard,
    ToggleCardEdit,
    ToggleCardSummary
} from '@salesforce/retail-react-app/app/components/toggle-card'
import ShippingAddressSelection from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-address-selection'
import AddressDisplay from '@salesforce/retail-react-app/app/components/address-display'
import {
    useShopperCustomersMutation,
    useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'

const submitButtonMessage = defineMessage({
    defaultMessage: 'Continue to Shipping Method',
    id: 'shipping_address.button.continue_to_shipping'
})

export default function ShippingAddress() {
    const {formatMessage} = useIntl()
    const [isLoading, setIsLoading] = useState()
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()
    const selectedShippingAddress = basket?.shipments && basket?.shipments[0]?.shippingAddress
    const {step, STEPS, goToStep, goToNextStep} = useCheckout()
    const createCustomerAddress = useShopperCustomersMutation('createCustomerAddress')
    const updateCustomerAddress = useShopperCustomersMutation('updateCustomerAddress')
    const updateShippingAddressForShipment = useShopperBasketsMutation(
        'updateShippingAddressForShipment'
    )

    const submitAndContinue = async (address) => {
        setIsLoading(true)
        const {
            addressId,
            address1,
            city,
            countryCode,
            firstName,
            lastName,
            phone,
            postalCode,
            stateCode
        } = address
        await updateShippingAddressForShipment.mutateAsync({
            parameters: {
                basketId: basket.basketId,
                shipmentId: 'me',
                useAsBilling: false
            },
            body: {
                address1,
                city,
                countryCode,
                firstName,
                lastName,
                phone,
                postalCode,
                stateCode
            }
        })

        if (customer.isRegistered && !addressId) {
            const body = {
                address1,
                city,
                countryCode,
                firstName,
                lastName,
                phone,
                postalCode,
                stateCode,
                addressId: nanoid()
            }
            await createCustomerAddress.mutateAsync({
                body,
                parameters: {customerId: customer.customerId}
            })
        }

        if (customer.isRegistered && addressId) {
            await updateCustomerAddress.mutateAsync({
                body: address,
                parameters: {
                    customerId: customer.customerId,
                    addressName: addressId
                }
            })
        }

        goToNextStep()
        setIsLoading(false)
    }

    return (
        <ToggleCard
            id="step-1"
            title={formatMessage({
                defaultMessage: 'Shipping Address',
                id: 'shipping_address.title.shipping_address'
            })}
            editing={step === STEPS.SHIPPING_ADDRESS}
            isLoading={isLoading}
            disabled={step === STEPS.CONTACT_INFO && !selectedShippingAddress}
            onEdit={() => goToStep(STEPS.SHIPPING_ADDRESS)}
        >
            <ToggleCardEdit>
                <ShippingAddressSelection
                    selectedAddress={selectedShippingAddress}
                    submitButtonLabel={submitButtonMessage}
                    onSubmit={submitAndContinue}
                />
            </ToggleCardEdit>
            {selectedShippingAddress && (
                <ToggleCardSummary>
                    <AddressDisplay address={selectedShippingAddress} />
                </ToggleCardSummary>
            )}
        </ToggleCard>
    )
}
