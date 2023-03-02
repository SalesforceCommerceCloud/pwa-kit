/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import { nanoid } from 'nanoid'
import {defineMessage, useIntl} from 'react-intl'
import {useCheckout} from '../util/checkout-context'
import {ToggleCard, ToggleCardEdit, ToggleCardSummary} from '../../../components/toggle-card'
import ShippingAddressSelection from './shipping-address-selection'
import AddressDisplay from '../../../components/address-display'
import {useShopperCustomersMutation} from 'commerce-sdk-react-preview'
import { useCurrentCustomer } from '../../../hooks/use-current-customer'

const submitButtonMessage = defineMessage({
    defaultMessage: 'Continue to Shipping Method',
    id: 'shipping_address.button.continue_to_shipping'
})

export default function ShippingAddress() {
    const {formatMessage} = useIntl()

    const {
        step,
        checkoutSteps,
        isGuestCheckout,
        selectedShippingAddress,
        setShippingAddress,
        setCheckoutStep,
        goToNextStep
    } = useCheckout()
    const [isLoading, setIsLoading] = useState()
    const {data: customer} = useCurrentCustomer()

    const createCustomerAddress = useShopperCustomersMutation({action: 'createCustomerAddress'})
    const updateCustomerAddress = useShopperCustomersMutation({action: 'updateCustomerAddress'})

    const submitAndContinue = async (address) => {
        setIsLoading(true)
        // await setShippingAddress(address)

        // @TODO:
        // await basket.setShippingAddress(address)

        //         // Add/Update the address to the customer's account if they are registered.
        //         if (!state.isGuestCheckout) {
        //             !addressId
        //                 ? customer.addSavedAddress(address)
        //                 : customer.updateSavedAddress({...address, addressId: addressId})
        //         }

        // step 1
        // basket setShippingAddress
        // step 2
        //  if registered
        //      if new -> add saved address
        //      if old -> update saved address

        const {addressId} = address
        if (!isGuestCheckout && !addressId) {
            const body = {
                ...address,
                addressId: nanoid()
            }
            await createCustomerAddress.mutateAsync({
                body,
                parameters: {customerId: customer.customerId}
            })
        }

        if (!isGuestCheckout && addressId) {
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
            editing={step === checkoutSteps.Shipping_Address}
            isLoading={isLoading}
            disabled={selectedShippingAddress == null}
            onEdit={() => setCheckoutStep(checkoutSteps.Shipping_Address)}
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
