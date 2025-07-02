/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState} from 'react'
import {FormattedMessage, useIntl} from 'react-intl'

// Components
import {Box, Button, Container, Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    ToggleCard,
    ToggleCardSummary
} from '@salesforce/retail-react-app/app/components/toggle-card'
import AddressDisplay from '@salesforce/retail-react-app/app/components/address-display'

// Hooks
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useShopperBasketsMutation, useStores} from '@salesforce/commerce-sdk-react'

const PickupAddress = () => {
    const {formatMessage} = useIntl()
    const [isLoading, setIsLoading] = useState()
    const updateShippingAddressForShipment = useShopperBasketsMutation(
        'updateShippingAddressForShipment'
    )
    const {step, STEPS, goToStep} = useCheckout()
    const {data: basket} = useCurrentBasket()

    const selectedShippingAddress = basket?.shipments && basket?.shipments[0]?.shippingAddress
    const isAddressFilled = selectedShippingAddress?.address1 && selectedShippingAddress?.city

    // Check if basket is a pickup order
    const isPickupOrder = basket?.shipments?.[0]?.shippingMethod?.c_storePickupEnabled === true
    const storeId = basket?.shipments?.[0]?.c_fromStoreId
    const {data: storeData} = useStores(
        {
            parameters: {
                ids: storeId
            }
        },
        {
            enabled: !!storeId && isPickupOrder
        }
    )
    const store = storeData?.data?.[0]
    const pickupAddress = {
        address1: store?.address1,
        city: store?.city,
        countryCode: store?.countryCode,
        postalCode: store?.postalCode,
        stateCode: store?.stateCode,
        firstName: store?.name,
        lastName: 'Pickup',
        phone: store?.phone
    }

    const submitAndContinue = async (address) => {
        setIsLoading(true)
        const {address1, city, countryCode, firstName, lastName, phone, postalCode, stateCode} =
            address
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
        setIsLoading(false)
        goToStep(STEPS.PAYMENT)
    }

    return (
        <ToggleCard
            id="step-1"
            title={formatMessage({
                defaultMessage: 'Pickup Address & Information',
                id: 'pickup_address.title.pickup_address'
            })}
            editing={step === STEPS.PICKUP_ADDRESS}
            disabled={step === STEPS.CONTACT_INFO}
            isLoading={isLoading}
        >
            {step === STEPS.PICKUP_ADDRESS && (
                <>
                    <Text fontWeight="bold" fontSize="md" mb={2}>
                        <FormattedMessage
                            defaultMessage="Store Information"
                            id="pickup_address.title.store_information"
                        />
                    </Text>
                    <AddressDisplay address={pickupAddress} />
                    <Box pt={3}>
                        <Container variant="form">
                            <Button w="full" onClick={() => submitAndContinue(pickupAddress)}>
                                <FormattedMessage
                                    defaultMessage="Continue to Payment"
                                    id="pickup_address.button.continue_to_payment"
                                />
                            </Button>
                        </Container>
                    </Box>
                </>
            )}
            {isAddressFilled && (
                <ToggleCardSummary>
                    <Text fontWeight="bold" fontSize="md" mb={2}>
                        <FormattedMessage
                            defaultMessage="Store Information"
                            id="pickup_address.title.store_information"
                        />
                    </Text>
                    <AddressDisplay address={selectedShippingAddress} />
                </ToggleCardSummary>
            )}
        </ToggleCard>
    )
}

export default PickupAddress
