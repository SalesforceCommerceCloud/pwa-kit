/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect} from 'react'
import {nanoid} from 'nanoid'
import {defineMessage, useIntl} from 'react-intl'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {
    ToggleCard,
    ToggleCardEdit,
    ToggleCardSummary
} from '@salesforce/retail-react-app/app/components/toggle-card'
import {Text} from '@salesforce/retail-react-app/app/components/shared/ui'
import ShippingAddressSelection from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-address-selection'
import AddressDisplay from '@salesforce/retail-react-app/app/components/address-display'
import {
    useShopperCustomersMutation,
    useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import ShippingMultiAddress from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-multi-address'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {useMultiship} from '@salesforce/retail-react-app/app/hooks/use-multiship'

const submitButtonMessage = defineMessage({
    defaultMessage: 'Continue to Shipping Method',
    id: 'shipping_address.button.continue_to_shipping'
})
const shippingAddressAriaLabel = defineMessage({
    defaultMessage: 'Shipping Address Form',
    id: 'shipping_address.label.shipping_address_form'
})
const addNewAddressLabel = defineMessage({
    defaultMessage: '+ Add New Address',
    id: 'shipping_address.button.add_new_address'
})
const noItemsInBasketMessage = defineMessage({
    defaultMessage: 'No items in basket.',
    id: 'shipping_address.message.no_items_in_basket'
})
const deliveryAddressLabel = defineMessage({
    defaultMessage: 'Delivery Address',
    id: 'shipping_address.label.delivery_address'
})
const shipToOneAddressLabel = defineMessage({
    defaultMessage: 'Ship Items to One Address',
    id: 'shipping_address.action.ship_to_one_address'
})
const deliverToMultipleAddressesLabel = defineMessage({
    defaultMessage: 'Deliver to Multiple Addresses',
    id: 'shipping_address.action.deliver_to_multiple_addresses'
})

export default function ShippingAddress() {
    const {formatMessage} = useIntl()
    const [isLoading, setIsLoading] = useState()
    const [guestAddresses, setGuestAddresses] = useState([])
    const [selectedGuestAddresses, setSelectedGuestAddresses] = useState({})
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()
    const selectedShippingAddress = basket?.shipments && basket?.shipments[0]?.shippingAddress
    const isAddressFilled = selectedShippingAddress?.address1 && selectedShippingAddress?.city

    // Check if there are multiple delivery shipments (multi-shipping was used)
    // We need to check for shipments with different addresses, not just multiple shipments
    const deliveryShipments =
        basket?.shipments?.filter((shipment) => shipment.shippingAddress) || []

    // Check if there are multiple shipments with different addresses
    const uniqueAddresses = new Set()
    deliveryShipments.forEach((shipment) => {
        if (shipment.shippingAddress) {
            const addressKey = `${shipment.shippingAddress.address1}-${shipment.shippingAddress.city}-${shipment.shippingAddress.postalCode}`
            uniqueAddresses.add(addressKey)
        }
    })

    const hasMultipleDeliveryShipments = uniqueAddresses.size > 1

    // Initialize multi-shipping state based on existing basket shipments
    const [isMultiShipping, setIsMultiShipping] = useState(hasMultipleDeliveryShipments)
    const {step, STEPS, goToStep} = useCheckout()
    const createCustomerAddress = useShopperCustomersMutation('createCustomerAddress')
    const updateCustomerAddress = useShopperCustomersMutation('updateCustomerAddress')
    const updateShippingAddressForShipment = useShopperBasketsMutation(
        'updateShippingAddressForShipment'
    )
    const showToast = useToast()

    // Get multiship functions for moving items to default shipment
    let moveItemsToDeliveryShipment = null
    let removeEmptyShipments = null
    try {
        const multishipHook = useMultiship(basket)
        moveItemsToDeliveryShipment = multishipHook?.moveItemsToDeliveryShipment
        removeEmptyShipments = multishipHook?.removeEmptyShipments
    } catch (error) {
        // Ignore
    }

    // Keep multi-shipping state in sync with basket shipments
    useEffect(() => {
        setIsMultiShipping(hasMultipleDeliveryShipments)
    }, [hasMultipleDeliveryShipments])

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

            // Ensure all items are assigned to the default shipment for single address mode
            if (basket?.productItems?.length > 0 && moveItemsToDeliveryShipment) {
                const itemsNotInDefaultShipment = basket.productItems.filter(
                    (item) => item.shipmentId !== 'me'
                )

                if (itemsNotInDefaultShipment.length > 0) {
                    await moveItemsToDeliveryShipment(itemsNotInDefaultShipment, 'me')
                }

                // In single ship mode, remove all empty shipments to consolidate to one shipment
                // In multiship mode, only remove empty shipments if there are multiple delivery shipments
                if (removeEmptyShipments && (!isMultiShipping || hasMultipleDeliveryShipments)) {
                    await removeEmptyShipments()
                }
            }

            goToStep(STEPS.SHIPPING_OPTIONS)
        } catch (e) {
            showToast({
                title: formatMessage({
                    defaultMessage: 'Error updating shipping address. Please try again.',
                    id: 'shipping_address.error.update_failed'
                }),
                status: 'error'
            })
        } finally {
            setIsLoading(false)
        }
    }

    // Determine if multi-shipping should be available
    const isEditingShippingAddress = step === STEPS.SHIPPING_ADDRESS

    return (
        <ToggleCard
            id="step-1"
            title={formatMessage({
                defaultMessage: 'Shipping Address',
                id: 'shipping_address.title.shipping_address'
            })}
            editing={isEditingShippingAddress}
            isLoading={isLoading}
            disabled={step === STEPS.CONTACT_INFO && !selectedShippingAddress}
            onEdit={() => goToStep(STEPS.SHIPPING_ADDRESS)}
            editLabel={formatMessage({
                defaultMessage: 'Edit Shipping Address',
                id: 'toggle_card.action.editShippingAddress'
            })}
            editAction={
                isMultiShipping
                    ? formatMessage(shipToOneAddressLabel)
                    : formatMessage(deliverToMultipleAddressesLabel)
            }
            onEditActionClick={async () => {
                const newMultiShippingState = !isMultiShipping
                setIsMultiShipping(newMultiShippingState)

                // If switching from multiship to single ship, consolidate all items to the default shipment
                if (
                    !newMultiShippingState &&
                    hasMultipleDeliveryShipments &&
                    moveItemsToDeliveryShipment
                ) {
                    try {
                        // Move all items to the default shipment ('me')
                        const allItems = basket?.productItems || []
                        if (allItems.length > 0) {
                            await moveItemsToDeliveryShipment(allItems, 'me')
                        }

                        // Remove empty shipments after consolidation
                        if (removeEmptyShipments) {
                            await removeEmptyShipments()
                        }
                    } catch (error) {
                        showToast({
                            title: formatMessage({
                                defaultMessage:
                                    'Error switching to single address. Please try again.',
                                id: 'shipping_address.error.switch_failed'
                            }),
                            status: 'error'
                        })
                    }
                }
            }}
        >
            <ToggleCardEdit>
                {!isMultiShipping ? (
                    <ShippingAddressSelection
                        selectedAddress={
                            customer && customer.isGuest
                                ? guestAddresses.length > 0
                                    ? guestAddresses[0]
                                    : null
                                : selectedShippingAddress
                        }
                        submitButtonLabel={submitButtonMessage}
                        onSubmit={submitAndContinue}
                        formTitleAriaLabel={shippingAddressAriaLabel}
                    />
                ) : (
                    <ShippingMultiAddress
                        basket={basket}
                        submitButtonLabel={submitButtonMessage}
                        addNewAddressLabel={addNewAddressLabel}
                        noItemsInBasketMessage={noItemsInBasketMessage}
                        deliveryAddressLabel={deliveryAddressLabel}
                        guestAddresses={guestAddresses}
                        setGuestAddresses={setGuestAddresses}
                        selectedGuestAddresses={selectedGuestAddresses}
                        setSelectedGuestAddresses={setSelectedGuestAddresses}
                    />
                )}
            </ToggleCardEdit>
            {isAddressFilled && (
                <ToggleCardSummary>
                    {hasMultipleDeliveryShipments ? (
                        <Text>
                            {formatMessage({
                                defaultMessage:
                                    'Your items are being delivered to multiple addresses. See details below.',
                                id: 'shipping_address.summary.multiple_addresses'
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
