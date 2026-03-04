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
    useShopperBasketsV2Mutation as useShopperBasketsMutation,
    useShippingMethodsForShipment
} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import {
    isPickupShipment,
    findExistingDeliveryShipment
} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {useItemShipmentManagement} from '@salesforce/retail-react-app/app/hooks/use-item-shipment-management'
import {useMultiship} from '@salesforce/retail-react-app/app/hooks/use-multiship'
import {useCheckoutAutoSelect} from '@salesforce/retail-react-app/app/hooks/use-checkout-auto-select'
import {DEFAULT_SHIPMENT_ID} from '@salesforce/retail-react-app/app/constants'
import PropTypes from 'prop-types'

const submitButtonMessage = defineMessage({
    defaultMessage: 'Continue to Shipping Method',
    id: 'shipping_address.button.continue_to_shipping'
})
const shippingAddressAriaLabel = defineMessage({
    defaultMessage: 'Shipping Address Form',
    id: 'shipping_address.label.shipping_address_form'
})

export default function ShippingAddress(props) {
    const {enableUserRegistration = false, isShipmentCleanupComplete = true} = props
    const {formatMessage} = useIntl()
    const [isManualSubmitLoading, setIsManualSubmitLoading] = useState(false)
    const {data: customer} = useCurrentCustomer()
    const currentBasketQuery = useCurrentBasket()
    const {data: basket} = currentBasketQuery
    const deliveryShipments =
        basket?.shipments?.filter((shipment) => !isPickupShipment(shipment)) || []
    const hasMultipleDeliveryShipments = deliveryShipments.length > 1
    const [isMultiShipping, setIsMultiShipping] = useState(hasMultipleDeliveryShipments)
    const [openedByUser, setOpenedByUser] = useState(false)
    const selectedShippingAddress = deliveryShipments[0]?.shippingAddress
    const targetDeliveryShipmentId = deliveryShipments[0]?.shipmentId || 'me'
    const isAddressFilled = selectedShippingAddress?.address1 && selectedShippingAddress?.city
    const {step, STEPS, goToStep, goToNextStep, contactPhone, setConsolidationLock} = useCheckout()
    const createCustomerAddress = useShopperCustomersMutation('createCustomerAddress')
    const updateCustomerAddress = useShopperCustomersMutation('updateCustomerAddress')
    const updateShippingAddressForShipment = useShopperBasketsMutation(
        'updateShippingAddressForShipment'
    )
    const multishipEnabled = getConfig()?.app?.multishipEnabled ?? true

    const {removeEmptyShipments} = useMultiship(basket)
    const {updateItemsToDeliveryShipment} = useItemShipmentManagement(basket?.basketId)

    // Check if there are multiple delivery items to show option to ship to multiple addresses
    // Only count items that are in delivery shipments (not pickup shipments)
    const deliveryItems =
        basket?.productItems?.filter((item) =>
            deliveryShipments.some((shipment) => shipment.shipmentId === item.shipmentId)
        ) || []
    const hasMultipleDeliveryItems = deliveryItems.length > 1

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
        setIsManualSubmitLoading(true)
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
            const phoneValue =
                (customer?.isRegistered
                    ? customer?.phoneHome
                    : contactPhone || basket?.billingAddress?.phone) ||
                address?.phone ||
                selectedShippingAddress?.phone

            const targetShipment = findExistingDeliveryShipment(basket)
            const targetShipmentId = targetShipment?.shipmentId || DEFAULT_SHIPMENT_ID
            let basketAfterItemMoves = null

            // Do not advance the step while basket mutations are in flight
            const willConsolidate = deliveryItems.some(
                (item) => item.shipmentId !== targetShipmentId
            )
            if (willConsolidate) {
                setConsolidationLock(true)
            }

            await updateShippingAddressForShipment.mutateAsync({
                parameters: {
                    basketId: basket.basketId,
                    shipmentId: targetShipmentId,
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

            // Skip saving address for newly registered users during checkout
            // The address will be saved after order placement instead
            if (customer.isRegistered && !addressId && !enableUserRegistration) {
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
            // Move all items to the single target delivery shipment.
            const itemsToMove = deliveryItems.filter((item) => item.shipmentId !== targetShipmentId)
            if (itemsToMove.length > 0) {
                basketAfterItemMoves = await updateItemsToDeliveryShipment(
                    itemsToMove,
                    targetShipmentId
                    // note: passing defaultInventoryId here is not needed
                )
            }
            // Remove any empty shipments. Use updated basket if available
            await removeEmptyShipments(basketAfterItemMoves || basket)
            setConsolidationLock(false)

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
            setConsolidationLock(false)
            setIsManualSubmitLoading(false)
        }
    }

    const {isLoading: isAutoSelectLoading, reset} = useCheckoutAutoSelect({
        currentStep: step,
        targetStep: STEPS.SHIPPING_ADDRESS,
        isCustomerRegistered: customer?.isRegistered,
        items: customer?.addresses,
        getPreferredItem: (addresses) =>
            addresses.find((addr) => addr.preferred === true) || addresses[0],
        shouldSkip: () => {
            if (!isShipmentCleanupComplete) return true
            if (openedByUser) return true
            if (selectedShippingAddress?.address1) {
                if (typeof goToNextStep === 'function') {
                    goToNextStep()
                }
                return true
            }
            return false
        },
        isAlreadyApplied: () => Boolean(selectedShippingAddress?.address1),
        applyItem: async (address) => {
            await submitAndContinue(address)
        },
        enabled: isShipmentCleanupComplete,
        // Navigation is already handled inside submitAndContinue (goToStep/goToNextStep)
        onSuccess: () => {},
        onError: (error) => {
            console.error('Failed to auto-select address:', error)
        }
    })

    const isLoading = isAutoSelectLoading || isManualSubmitLoading || !isShipmentCleanupComplete

    const handleEdit = () => {
        setOpenedByUser(true)
        reset()
        goToStep(STEPS.SHIPPING_ADDRESS)
    }

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
            onEdit={handleEdit}
            editLabel={formatMessage({
                defaultMessage: 'Change',
                id: 'toggle_card.action.change'
            })}
            editAction={
                multishipEnabled && hasMultipleDeliveryItems
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
                multishipEnabled && hasMultipleDeliveryItems && setIsMultiShipping((v) => !v)
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

ShippingAddress.propTypes = {
    enableUserRegistration: PropTypes.bool,
    isShipmentCleanupComplete: PropTypes.bool
}
