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
import {Text, useDisclosure} from '@salesforce/retail-react-app/app/components/shared/ui'
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
import {useItemShipmentManagement} from '@salesforce/retail-react-app/app/hooks/use-item-shipment-management'
import {useMultiship} from '@salesforce/retail-react-app/app/hooks/use-multiship'
import {DEFAULT_SHIPMENT_ID} from '@salesforce/retail-react-app/app/constants'
import {getConfig} from '@salesforce/pwa-kit-runtime/utils/ssr-config'
import {
    sanitizedCustomerAddress,
    cleanAddressForOrder
} from '@salesforce/retail-react-app/app/utils/address-utils'
import {
    findExistingDeliveryShipment,
    isPickupShipment
} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import SingleAddressToggleModal from '@salesforce/retail-react-app/app/components/single-address-toggle-modal'

const submitButtonMessage = defineMessage({
    defaultMessage: 'Continue to Shipping Method',
    id: 'shipping_address.button.continue_to_shipping'
})
const shippingAddressAriaLabel = defineMessage({
    defaultMessage: 'Shipping Address Form',
    id: 'shipping_address.label.shipping_address_form'
})
const noItemsInBasketMessage = defineMessage({
    defaultMessage: 'No items in basket.',
    id: 'shipping_address.message.no_items_in_basket'
})
const shipToOneAddressLabel = defineMessage({
    defaultMessage: 'Ship to Single Address',
    id: 'shipping_address.action.ship_to_single_address'
})
const deliverToMultipleAddressesLabel = defineMessage({
    defaultMessage: 'Ship to Multiple Addresses',
    id: 'shipping_address.action.ship_to_multiple_addresses'
})

export default function ShippingAddress() {
    const {formatMessage} = useIntl()
    const [isLoading, setIsLoading] = useState()
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()
    const multishipEnabled = getConfig()?.app?.multishipEnabled ?? true
    const {removeEmptyShipments} = useMultiship(basket)
    const {updateItemsToDeliveryShipment} = useItemShipmentManagement(basket?.basketId)
    const selectedShipment = findExistingDeliveryShipment(basket)
    const selectedShippingAddress = selectedShipment?.shippingAddress
    const isAddressFilled = selectedShippingAddress?.address1 && selectedShippingAddress?.city

    // Check if there are multiple product items to show option to ship to multiple addresses
    const productItemsCount = basket?.productItems?.length || 0
    const hasMultipleProductItems = productItemsCount > 1

    // Check if there are multiple delivery shipments (multi-shipping was used)
    const deliveryShipments =
        basket?.shipments?.filter((shipment) => !isPickupShipment(shipment)) || []
    const hasMultipleDeliveryShipments = deliveryShipments.length > 1

    // Initialize multi-shipping state based on existing basket shipments
    const [isMultiShipping, setIsMultiShipping] = useState(hasMultipleDeliveryShipments)
    const {
        isOpen: showWarningModal,
        onOpen: openWarningModal,
        onClose: closeWarningModal
    } = useDisclosure()
    const [hasUnpersistedGuestAddresses, sethasUnpersistedGuestAddresses] = useState(false)
    const {step, STEPS, goToStep} = useCheckout()
    const createCustomerAddress = useShopperCustomersMutation('createCustomerAddress')
    const updateCustomerAddress = useShopperCustomersMutation('updateCustomerAddress')
    const updateShippingAddressForShipment = useShopperBasketsMutation(
        'updateShippingAddressForShipment'
    )
    const showToast = useToast()

    // Keep multi-shipping state in sync with basket shipments
    useEffect(() => {
        setIsMultiShipping(hasMultipleDeliveryShipments)
    }, [hasMultipleDeliveryShipments])

    // handle unpersisted address status from ShippingMultiAddress
    const handleUnsavedGuestAddressesToggleWarning = (hasUnsaved) => {
        sethasUnpersistedGuestAddresses(hasUnsaved)
    }

    // Handle toggle between single and multi-shipping
    const handleToggleShippingMode = () => {
        if (isMultiShipping && customer?.isGuest && hasUnpersistedGuestAddresses) {
            openWarningModal()
        } else {
            setIsMultiShipping(!isMultiShipping)
        }
    }

    // handle confirmation to single address
    const handleConfirmSwitchToSingle = () => {
        setIsMultiShipping(false)
        closeWarningModal()
    }

    const handleCancelSwitch = () => {
        closeWarningModal()
    }

    const submitAndContinue = async (address) => {
        setIsLoading(true)
        try {
            const {addressId} = address
            const targetShipment = findExistingDeliveryShipment(basket)
            const targetShipmentId = targetShipment?.shipmentId || DEFAULT_SHIPMENT_ID
            let basketAfterItemMoves = null

            await updateShippingAddressForShipment.mutateAsync({
                parameters: {
                    basketId: basket.basketId,
                    shipmentId: targetShipmentId,
                    useAsBilling: false
                },
                body: cleanAddressForOrder(address)
            })

            if (customer.isRegistered && !addressId) {
                const body = {
                    ...sanitizedCustomerAddress(address),
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
            // Move all items to the single target delivery shipment.
            const deliveryItems =
                basket?.productItems?.filter((item) =>
                    deliveryShipments.some((shipment) => shipment.shipmentId === item.shipmentId)
                ) || []
            const itemsToMove = deliveryItems.filter((item) => item.shipmentId !== targetShipmentId)
            if (itemsToMove.length > 0) {
                basketAfterItemMoves = await updateItemsToDeliveryShipment(
                    itemsToMove,
                    targetShipmentId
                    // note: passing defaultInventoryId here is not needed
                )
            }
            // Remove any empty shipments.
            await removeEmptyShipments(basketAfterItemMoves || basket)

            goToStep(STEPS.SHIPPING_OPTIONS)
        } catch (e) {
            showToast({
                title: formatMessage({
                    defaultMessage:
                        'Something went wrong while updating the shipping address. Try again.',
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
        <>
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
                editLabel={
                    isMultiShipping
                        ? formatMessage({
                              defaultMessage: 'Edit Shipping Addresses',
                              id: 'toggle_card.action.editShippingAddresses'
                          })
                        : formatMessage({
                              defaultMessage: 'Edit Shipping Address',
                              id: 'toggle_card.action.editShippingAddress'
                          })
                }
                editAction={
                    multishipEnabled && hasMultipleProductItems
                        ? isMultiShipping
                            ? formatMessage(shipToOneAddressLabel)
                            : formatMessage(deliverToMultipleAddressesLabel)
                        : null
                }
                onEditActionClick={
                    multishipEnabled && hasMultipleProductItems ? handleToggleShippingMode : null
                }
            >
                <ToggleCardEdit>
                    {!isMultiShipping ? (
                        <ShippingAddressSelection
                            selectedAddress={selectedShippingAddress}
                            submitButtonLabel={submitButtonMessage}
                            onSubmit={submitAndContinue}
                            formTitleAriaLabel={shippingAddressAriaLabel}
                        />
                    ) : (
                        <ShippingMultiAddress
                            basket={basket}
                            submitButtonLabel={submitButtonMessage}
                            noItemsInBasketMessage={noItemsInBasketMessage}
                            onUnsavedGuestAddressesToggleWarning={
                                handleUnsavedGuestAddressesToggleWarning
                            }
                        />
                    )}
                </ToggleCardEdit>
                {isAddressFilled && (
                    <ToggleCardSummary>
                        {hasMultipleDeliveryShipments ? (
                            <Text>
                                {formatMessage({
                                    defaultMessage:
                                        'Your items will be shipped to multiple addresses.',
                                    id: 'shipping_address.summary.multiple_addresses'
                                })}
                            </Text>
                        ) : (
                            <AddressDisplay address={selectedShippingAddress} />
                        )}
                    </ToggleCardSummary>
                )}
            </ToggleCard>

            <SingleAddressToggleModal
                isOpen={showWarningModal}
                onClose={closeWarningModal}
                onConfirm={handleConfirmSwitchToSingle}
                onCancel={handleCancelSwitch}
            />
        </>
    )
}
