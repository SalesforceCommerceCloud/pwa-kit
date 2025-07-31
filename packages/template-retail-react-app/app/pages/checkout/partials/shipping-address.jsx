/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useState, useEffect} from 'react'
import {nanoid} from 'nanoid'
import {defineMessage, useIntl} from 'react-intl'
import {Box, Text, Flex, Button} from '@salesforce/retail-react-app/app/components/shared/ui'
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
    const [isMultiShipping, setIsMultiShipping] = useState(() => {
        const saved = sessionStorage.getItem('pwa-kit-shipping-mode')
        return saved === 'multi'
    })
    
    // Persist shipping mode to sessionStorage
    const updateShippingMode = (mode) => {
        setIsMultiShipping(mode)
        sessionStorage.setItem('pwa-kit-shipping-mode', mode ? 'multi' : 'single')
        
        // Don't clear multi-shipping data when switching modes - preserve user's work
        

    }
    
    const {data: customer} = useCurrentCustomer()
    const {data: basket} = useCurrentBasket()
    const selectedShippingAddress = basket?.shipments && basket?.shipments[0]?.shippingAddress
    const isAddressFilled = selectedShippingAddress?.address1 && selectedShippingAddress?.city
    const {step, STEPS, goToStep} = useCheckout()
    
    // Don't automatically clear sessionStorage - let it persist until checkout is complete
    // The sessionStorage will be cleared when the user completes checkout or starts a new session
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

            // Clear multi-shipping data when completing checkout
            sessionStorage.removeItem('pwa-kit-multiship-selected-addresses')
            sessionStorage.removeItem('pwa-kit-multiship-guest-addresses')
            
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
    
    // Only rely on user's explicit choice - don't try to detect from basket state
    const shouldShowMultiShipping = isMultiShipping
    
    // Track if user has completed multi-shipping by clicking "Proceed"
    const [hasCompletedMultiShipping, setHasCompletedMultiShipping] = useState(() => {
        const saved = sessionStorage.getItem('pwa-kit-multiship-completed')
        return saved === 'true'
    })
    
    // For multi-shipping, check if addresses are assigned to products
    const hasMultiShippingAddresses = shouldShowMultiShipping && basket?.productItems?.some(item => {
        const savedAddresses = sessionStorage.getItem('pwa-kit-multiship-selected-addresses')
        if (savedAddresses) {
            const selectedAddresses = JSON.parse(savedAddresses)
            return selectedAddresses[item.itemId]
        }
        return false
    })
    
    // Show summary mode only if user has explicitly completed multi-shipping by clicking "Proceed"
    const shouldShowMultiShippingSummary = shouldShowMultiShipping && hasMultiShippingAddresses && hasCompletedMultiShipping
    
    console.log('Multi-shipping state:', {
        shouldShowMultiShipping,
        hasMultiShippingAddresses,
        hasCompletedMultiShipping,
        shouldShowMultiShippingSummary,
        savedAddresses: sessionStorage.getItem('pwa-kit-multiship-selected-addresses'),
        completedStorage: sessionStorage.getItem('pwa-kit-multiship-completed')
    })
    

    


    return (
        <>
            {!shouldShowMultiShipping ? (
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
                    editAction={formatMessage(deliverToMultipleAddressesLabel)}
                    onEditActionClick={() => {
                        setHasCompletedMultiShipping(false)
                        sessionStorage.setItem('pwa-kit-multiship-completed', 'false')
                        updateShippingMode(true)
                    }}
                >
                    <ToggleCardEdit>
                        <ShippingAddressSelection
                            selectedAddress={selectedShippingAddress}
                            submitButtonLabel={submitButtonMessage}
                            onSubmit={submitAndContinue}
                            formTitleAriaLabel={shippingAddressAriaLabel}
                        />
                    </ToggleCardEdit>
                    {isAddressFilled && (
                        <ToggleCardSummary>
                            <AddressDisplay address={selectedShippingAddress} />
                        </ToggleCardSummary>
                    )}
                </ToggleCard>
            ) : (
                <>
                    {!shouldShowMultiShippingSummary ? (
                        <ToggleCard
                            id="step-1"
                            title={formatMessage({
                                defaultMessage: 'Shipping Address',
                                id: 'shipping_address.title.shipping_address'
                            })}
                            editing={true}
                            isLoading={isLoading}
                            disabled={false}
                            onEdit={() => goToStep(STEPS.SHIPPING_ADDRESS)}
                            editLabel={formatMessage({
                                defaultMessage: 'Edit Shipping Address',
                                id: 'toggle_card.action.editShippingAddress'
                            })}
                            editAction={formatMessage(shipToOneAddressLabel)}
                            onEditActionClick={() => {
                                updateShippingMode(false)
                            }}
                        >
                            <ToggleCardEdit>
                                <ShippingMultiAddress
                                    basket={basket}
                                    submitButtonLabel={submitButtonMessage}
                                    addNewAddressLabel={addNewAddressLabel}
                                    noItemsInBasketMessage={noItemsInBasketMessage}
                                    deliveryAddressLabel={deliveryAddressLabel}
                                    onProceedSuccess={() => setHasCompletedMultiShipping(true)}
                                />
                            </ToggleCardEdit>
                        </ToggleCard>
                    ) : (
                        <Box
                            border="1px"
                            borderColor="gray.200"
                            borderRadius="md"
                            p={4}
                            bg="white"
                        >
                            <Flex justify="space-between" align="center" mb={2}>
                                <Text fontWeight="bold" fontSize="lg">
                                    {formatMessage({
                                        defaultMessage: 'Delivering to Multiple Addresses',
                                        id: 'shipping_address.summary.delivering_to_multiple'
                                    })}
                                </Text>
                                <Button
                                    variant="link"
                                    size="sm"
                                    onClick={() => {
                                        setHasCompletedMultiShipping(false)
                                        sessionStorage.setItem('pwa-kit-multiship-completed', 'false')
                                        goToStep(STEPS.SHIPPING_ADDRESS)
                                    }}
                                    color="blue.600"
                                    _hover={{color: 'blue.700'}}
                                >
                                    {formatMessage({
                                        defaultMessage: 'Edit',
                                        id: 'shipping_address.action.edit'
                                    })}
                                </Button>
                            </Flex>
                            <Text color="gray.600" fontSize="sm">
                                {formatMessage({
                                    defaultMessage: 'Your items are being delivered to multiple addresses. See details below',
                                    id: 'shipping_address.summary.multiple_addresses_description'
                                })}
                            </Text>
                        </Box>
                    )}
                </>
            )}
        </>
    )
}
