import React, {useState} from 'react'
import {useCheckout} from '../util/checkout-context'
import {ToggleCard, ToggleCardEdit, ToggleCardSummary} from '../../../components/toggle-card'
import ShippingAddressSelection from './shipping-address-selection'
import AddressDisplay from '../../../components/address-display'

export default function ShippingAddress() {
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
        // TODO: [l10n] localize this title
        <ToggleCard
            id="step-1"
            title="Shipping Address"
            editing={step === 1}
            isLoading={isLoading}
            disabled={selectedShippingAddress == null}
            onEdit={() => setCheckoutStep(1)}
        >
            <ToggleCardEdit>
                {/* TODO: [l10n] localize this button label */}
                <ShippingAddressSelection
                    selectedAddress={selectedShippingAddress}
                    submitButtonLabel="Continue to Shipping Method"
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
