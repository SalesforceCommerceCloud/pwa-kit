/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {defineMessage, useIntl} from 'react-intl'
import {useCheckout} from '../util/checkout-context'
import {ToggleCard, ToggleCardEdit, ToggleCardSummary} from '../../../components/toggle-card'
import ShippingAddressSelection from './shipping-address-selection'
import AddressDisplay from '../../../components/address-display'

const submitButtonMessage = defineMessage({
    defaultMessage: 'Continue to Shipping Method',
    id: 'shipping_address.button.continue_to_shipping'
})

export default function ShippingAddress() {
    const {formatMessage} = useIntl()

    const {
        step,
        selectedShippingAddress,
        setShippingAddress,
        setCheckoutStep,
        goToNextStep
    } = useCheckout()
    const [isLoading, setIsLoading] = useState()

    const submitAndContinue = async (address) => {
        setIsLoading(true)
        await setShippingAddress(address)
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
            editing={step === 1}
            isLoading={isLoading}
            disabled={selectedShippingAddress == null}
            onEdit={() => setCheckoutStep(1)}
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
