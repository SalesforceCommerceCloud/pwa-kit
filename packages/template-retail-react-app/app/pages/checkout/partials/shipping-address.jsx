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
import ShippingMultiAddress from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-multi-address'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'

const submitButtonMessage = defineMessage({
    defaultMessage: 'Continue to Shipping Method',
    id: 'shipping_address.button.continue_to_shipping'
})
const shippingAddressAriaLabel = defineMessage({
    defaultMessage: 'Shipping Address Form',
    id: 'shipping_address.label.shipping_address_form'
})
const addNewAddressLabel = defineMessage({
    defaultMessage: 'Add New Address',
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
    const [isMultiShipping, setIsMultiShipping] = useState(false)
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()
    const selectedShippingAddress = basket?.shipments && basket?.shipments[0]?.shippingAddress
    const isAddressFilled = selectedShippingAddress?.address1 && selectedShippingAddress?.city
    const {step, STEPS, goToStep} = useCheckout()
    const createCustomerAddress = useShopperCustomersMutation('createCustomerAddress')
    const updateCustomerAddress = useShopperCustomersMutation('updateCustomerAddress')
    const updateShippingAddressForShipment = useShopperBasketsMutation(
        'updateShippingAddressForShipment'
    )
    const showToast = useToast()

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
            onEditActionClick={() => {
                setIsMultiShipping(!isMultiShipping)
            }}
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
                        addNewAddressLabel={addNewAddressLabel}
                        noItemsInBasketMessage={noItemsInBasketMessage}
                        deliveryAddressLabel={deliveryAddressLabel}
                    />
                )}
            </ToggleCardEdit>
            {isAddressFilled && (
                <ToggleCardSummary>
                    <AddressDisplay address={selectedShippingAddress} />
                </ToggleCardSummary>
            )}
        </ToggleCard>
    )
}
