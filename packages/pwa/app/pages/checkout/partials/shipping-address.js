import React from 'react'
import {Box, Text} from '@chakra-ui/react'
import {useCheckout} from '../util/checkout-context'
import {Section, SectionEdit, SectionSummary} from './section'
import ShippingAddressSelection from './shipping-address-selection'

export default function ShippingAddress() {
    const {
        step,
        selectedShippingAddress,
        setShippingAddress,
        setCheckoutStep,
        goToNextStep
    } = useCheckout()

    const submitAndContinue = async (address) => {
        await setShippingAddress(address)
        goToNextStep()
    }

    return (
        <Section
            id="step-1"
            title="Shipping Address"
            editing={step === 1}
            disabled={selectedShippingAddress == null}
            onEdit={() => setCheckoutStep(1)}
        >
            <SectionEdit>
                <ShippingAddressSelection
                    selectedAddress={selectedShippingAddress}
                    submitButtonLabel="Continue to Shipping Options"
                    onSubmit={submitAndContinue}
                />
            </SectionEdit>
            {selectedShippingAddress && (
                <SectionSummary>
                    <Box>
                        <Text>{selectedShippingAddress.fullName}</Text>
                        <Text>{selectedShippingAddress.address1}</Text>
                        <Text>
                            {selectedShippingAddress.city}, {selectedShippingAddress.stateCode}{' '}
                            {selectedShippingAddress.postalCode}
                        </Text>
                        <Text>{selectedShippingAddress.countryCode}</Text>
                    </Box>
                </SectionSummary>
            )}
        </Section>
    )
}
