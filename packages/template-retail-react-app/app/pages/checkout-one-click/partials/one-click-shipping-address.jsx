/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect} from 'react'
import {nanoid} from 'nanoid'
import {defineMessage, useIntl} from 'react-intl'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context'
import {
    ToggleCard,
    ToggleCardEdit,
    ToggleCardSummary
} from '@salesforce/retail-react-app/app/components/toggle-card'
import ShippingAddressSelection from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-address-selection'
import AddressDisplay from '@salesforce/retail-react-app/app/components/address-display'
import OneClickShippingMultiAddress from '@salesforce/retail-react-app/app/pages/checkout-one-click/partials/one-click-shipping-multi-address'
import {
    useShopperCustomersMutation,
    useShopperBasketsMutation,
    useShippingMethodsForShipment
} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {isPickupShipment} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'

const submitButtonMessage = defineMessage({
    defaultMessage: 'Continue to Shipping Method',
    id: 'shipping_address.button.continue_to_shipping'
})
const shippingAddressAriaLabel = defineMessage({
    defaultMessage: 'Shipping Address Form',
    id: 'shipping_address.label.shipping_address_form'
})

export default function ShippingAddress() {
    const {formatMessage} = useIntl()
    const toast = useToast()
    const [isLoading, setIsLoading] = useState()
    const [hasAutoSelected, setHasAutoSelected] = useState(false)
    const [isMultiShipping, setIsMultiShipping] = useState(false)
    const [openedByUser, setOpenedByUser] = useState(false)
    const {data: customer} = useCurrentCustomer()
    const currentBasketQuery = useCurrentBasket()
    const {data: basket} = currentBasketQuery
    const deliveryShipments =
        basket?.shipments?.filter((shipment) => !isPickupShipment(shipment)) || []
    const selectedShippingAddress = deliveryShipments[0]?.shippingAddress
    const targetDeliveryShipmentId = deliveryShipments[0]?.shipmentId || 'me'
    const isAddressFilled = selectedShippingAddress?.address1 && selectedShippingAddress?.city
    const {step, STEPS, goToStep, goToNextStep, contactPhone} = useCheckout()
    const createCustomerAddress = useShopperCustomersMutation('createCustomerAddress')
    const updateCustomerAddress = useShopperCustomersMutation('updateCustomerAddress')
    const updateShippingAddressForShipment = useShopperBasketsMutation(
        'updateShippingAddressForShipment'
    )
    const productItemsCount = basket?.productItems?.length || 0
    const hasMultipleProductItems = productItemsCount > 1
    const multishipEnabled = getConfig()?.app?.multishipEnabled ?? true

    const hasMultipleDeliveryShipments = deliveryShipments.length > 1

    // Prepare a shipping methods query we can manually refetch after address updates
    const shippingMethodsQuery = useShippingMethodsForShipment(
        {
            parameters: {
                basketId: basket?.basketId,
                shipmentId: targetDeliveryShipmentId
            }
        },
        {
            enabled: false
        }
    )

    const submitAndContinue = async (address) => {
        setIsLoading(true)
        try {
            const {
                addressId,
                address1,
                city,
                countryCode,
                firstName,
                lastName,
                postalCode,
                stateCode
            } = address
            const phoneValue = customer?.isRegistered
                ? customer?.phoneHome || address?.phone || selectedShippingAddress?.phone
                : contactPhone || address?.phone || selectedShippingAddress?.phone
            // Ensure we target the latest basket id in case it changed
            const refreshed = await currentBasketQuery.refetch()
            const latestBasketId = refreshed?.data?.basketId || basket.basketId

            await updateShippingAddressForShipment.mutateAsync({
                parameters: {
                    basketId: latestBasketId,
                    shipmentId: targetDeliveryShipmentId,
                    useAsBilling: false
                },
                body: {
                    address1,
                    city,
                    countryCode,
                    firstName,
                    lastName,
                    phone: phoneValue,
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
                    phone: phoneValue,
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
                    body: {...address, phone: phoneValue},
                    parameters: {
                        customerId: customer.customerId,
                        addressName: addressId
                    }
                })
            }

            // For registered shoppers: if an existing shipping method is still valid for the new address,
            // skip the Shipping Options step and go straight to Payment.
            try {
                const selectedMethodId = deliveryShipments[0]?.shippingMethod?.id
                if (customer?.isRegistered && selectedMethodId) {
                    const methods = await shippingMethodsQuery.refetch()
                    const applicable = methods?.data?.applicableShippingMethods || []
                    const stillValid = applicable.some((m) => m.id === selectedMethodId)
                    if (stillValid) {
                        goToStep?.(STEPS.PAYMENT)
                    } else {
                        goToNextStep?.()
                    }
                } else {
                    goToNextStep?.()
                }
            } catch {
                // On any failure, fall back to normal progression
                goToNextStep?.()
            }
        } catch (error) {
            if (process.env.NODE_ENV !== 'test') {
                console.error('Error submitting shipping address:', error)
            }
        } finally {
            setIsLoading(false)
        }
    }

    // Auto-select and apply preferred shipping address for registered users
    useEffect(() => {
        const autoSelectPreferredAddress = async () => {
            // Only auto-select when on this step and haven't already auto-selected
            if (step !== STEPS.SHIPPING_ADDRESS || hasAutoSelected || isLoading) {
                return
            }

            // If user explicitly opened this card, do not auto-advance
            if (openedByUser) {
                return
            }

            if (multishipEnabled && hasMultipleProductItems) {
                return
            }

            // Only proceed if customer is registered and has addresses
            if (!customer?.isRegistered || !customer?.addresses?.length) {
                return
            }

            // Skip to next step if basket already has a shipping address
            if (selectedShippingAddress?.address1) {
                setHasAutoSelected(true) // Prevent further attempts
                if (typeof goToNextStep === 'function') {
                    goToNextStep()
                }
                return
            }

            // Choose preferred address if set; otherwise fallback to first address
            const preferredAddress =
                customer.addresses.find((addr) => addr.preferred === true) || customer.addresses[0]

            //Auto-selecting preferred shipping address
            if (preferredAddress) {
                setHasAutoSelected(true)

                try {
                    // Apply the preferred address and continue to next step
                    await submitAndContinue(preferredAddress)
                } catch (error) {
                    // Reset on error so user can manually select
                    setHasAutoSelected(false)
                }
            }
        }

        autoSelectPreferredAddress()
    }, [
        step,
        customer,
        selectedShippingAddress,
        hasAutoSelected,
        isLoading,
        multishipEnabled,
        hasMultipleProductItems,
        openedByUser
    ])

    // Reset manual-open flag when leaving this step
    useEffect(() => {
        if (step !== STEPS.SHIPPING_ADDRESS && openedByUser) {
            setOpenedByUser(false)
        }
    }, [step, STEPS.SHIPPING_ADDRESS, openedByUser])

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
            onEdit={() => {
                setOpenedByUser(true)
                goToStep(STEPS.SHIPPING_ADDRESS)
            }}
            editLabel={formatMessage({
                defaultMessage: 'Change',
                id: 'toggle_card.action.change'
            })}
            editAction={
                multishipEnabled && hasMultipleProductItems
                    ? isMultiShipping
                        ? formatMessage({
                              defaultMessage: 'Ship items to one address',
                              id: 'shipping_multi_address.action.ship_to_single_address'
                          })
                        : formatMessage({
                              defaultMessage: 'Ship to multiple addresses',
                              id: 'shipping_address.action.ship_to_multiple_addresses'
                          })
                    : undefined
            }
            onEditActionClick={() =>
                multishipEnabled && hasMultipleProductItems && setIsMultiShipping((v) => !v)
            }
        >
            <ToggleCardEdit>
                {isMultiShipping ? (
                    <OneClickShippingMultiAddress
                        basket={basket}
                        onBackToSingle={() => setIsMultiShipping(false)}
                    />
                ) : (
                    <ShippingAddressSelection
                        selectedAddress={selectedShippingAddress}
                        submitButtonLabel={submitButtonMessage}
                        onSubmit={submitAndContinue}
                        formTitleAriaLabel={shippingAddressAriaLabel}
                    />
                )}
            </ToggleCardEdit>
            {(hasMultipleDeliveryShipments || isAddressFilled) && (
                <ToggleCardSummary>
                    {hasMultipleDeliveryShipments ? (
                        <Text>
                            {formatMessage({
                                defaultMessage: 'You are shipping to multiple locations.',
                                id: 'shipping_address.summary.multiple_locations'
                            })}
                        </Text>
                    ) : (
                        <AddressDisplay address={selectedShippingAddress} />
                    )}
                </ToggleCardSummary>
            )}
        </ToggleCard>
    )
}
