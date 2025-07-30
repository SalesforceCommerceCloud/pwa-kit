/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {FormattedMessage, FormattedNumber, useIntl} from 'react-intl'
import {
    Box,
    Button,
    Container,
    Flex,
    Radio,
    RadioGroup,
    Stack,
    Text
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useForm, Controller} from 'react-hook-form'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {ChevronDownIcon} from '@salesforce/retail-react-app/app/components/icons'
import {
    ToggleCard,
    ToggleCardEdit,
    ToggleCardSummary
} from '@salesforce/retail-react-app/app/components/toggle-card'
import {
    useShippingMethodsForShipment,
    useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'

// Component to handle shipping options for a single shipment
const ShipmentOptions = ({shipment, basketId, currency, control, showLabel}) => {
    const {formatMessage} = useIntl()
    const {data: shippingMethods} = useShippingMethodsForShipment(
        {
            parameters: {
                basketId: basketId,
                shipmentId: shipment.shipmentId
            }
        },
        {
            enabled: Boolean(basketId && shipment.shipmentId && shipment.shippingAddress)
        }
    )

    if (!shipment.shippingAddress) {
        return null
    }

    const fieldName = `shippingMethodId_${shipment.shipmentId}`
    const defaultValue = shipment.shippingMethod?.id || shippingMethods?.defaultShippingMethodId || ''

    return (
        <Box>
            {showLabel && (
                <Box mb={2}>
                    <Text fontWeight="semibold">
                        {formatMessage({
                            defaultMessage: 'Delivering to {name}',
                            id: 'shipping_options.label.delivering_to'
                        }, {
                            name: `${shipment.shippingAddress.firstName} ${shipment.shippingAddress.lastName}`
                        })}
                    </Text>
                    <Text fontSize="sm" color="gray.600">
                        {shipment.shippingAddress.address1}, {shipment.shippingAddress.city}, {shipment.shippingAddress.stateCode} {shipment.shippingAddress.postalCode}
                    </Text>
                </Box>
            )}
            {shippingMethods?.applicableShippingMethods && (
                <Controller
                    name={fieldName}
                    control={control}
                    defaultValue={defaultValue}
                    rules={{ required: true }}
                    render={({field}) => (
                        <RadioGroup
                            {...field}
                            name={`shipping-options-radiogroup-${shipment.shipmentId}`}
                        >
                            <Stack spacing={5}>
                                {shippingMethods.applicableShippingMethods.map(
                                    (opt) => (
                                        <Radio value={opt.id} key={opt.id}>
                                            <Flex justify="space-between" w="full">
                                                <Box>
                                                    <Text>{opt.name}</Text>
                                                    <Text
                                                        fontSize="sm"
                                                        color="gray.600"
                                                    >
                                                        {opt.description}
                                                    </Text>
                                                </Box>
                                                <Text fontWeight="bold">
                                                    <FormattedNumber
                                                        value={opt.price}
                                                        style="currency"
                                                        currency={currency}
                                                    />
                                                </Text>
                                            </Flex>

                                            {opt.shippingPromotions?.map((promo) => {
                                                return (
                                                    <Text
                                                        key={promo.promotionId}
                                                        fontSize="sm"
                                                        color="green.600"
                                                    >
                                                        {promo.calloutMsg}
                                                    </Text>
                                                )
                                            })}
                                        </Radio>
                                    )
                                )}
                            </Stack>
                        </RadioGroup>
                    )}
                />
            )}
            
            {/* Gift option for each shipment */}
            <Box mt={4}>
                <Button variant="link" size="sm" rightIcon={<ChevronDownIcon />}>
                    <FormattedMessage
                        defaultMessage="Do you want to send this as a gift?"
                        id="shipping_options.action.send_as_a_gift"
                    />
                </Button>
            </Box>
        </Box>
    )
}

export default function ShippingOptions() {
    const {formatMessage} = useIntl()
    const {step, STEPS, goToStep, goToNextStep} = useCheckout()
    const {data: basket} = useCurrentBasket()
    const {currency} = useCurrency()
    const updateShippingMethod = useShopperBasketsMutation('updateShippingMethodForShipment')

    // Get all shipments that have shipping addresses
    const shipmentsWithAddresses = basket?.shipments?.filter(
        shipment => shipment.shippingAddress 
    ) || []

    // Build initial form values
    const getInitialValues = () => {
        const values = {}
        shipmentsWithAddresses.forEach(shipment => {
            values[`shippingMethodId_${shipment.shipmentId}`] = shipment.shippingMethod?.id || ''
        })
        return values
    }

    const form = useForm({
        mode: 'onChange',
        defaultValues: getInitialValues()
    })

    // Update form when shipments change
    useEffect(() => {
        const currentValues = form.getValues()
        const newDefaults = getInitialValues()
        
        // Only reset if there are new fields or values have changed
        const hasNewFields = Object.keys(newDefaults).some(key => !(key in currentValues))
        if (hasNewFields) {
            form.reset(newDefaults)
        }
    }, [shipmentsWithAddresses.length])

    const submitForm = async (formData) => {
        // Submit shipping method for each shipment
        const promises = shipmentsWithAddresses.map(shipment => {
            const methodId = formData[`shippingMethodId_${shipment.shipmentId}`]
            if (methodId) {
                return updateShippingMethod.mutateAsync({
                    parameters: {
                        basketId: basket.basketId,
                        shipmentId: shipment.shipmentId
                    },
                    body: {
                        id: methodId
                    }
                })
            }
            return Promise.resolve()
        })
        
        await Promise.all(promises)
        goToNextStep()
    }

    // Calculate total shipping info
    const totalShippingCost = basket?.shippingItems?.reduce((total, item) => {
        return total + (item.priceAfterItemDiscount || item.price || 0)
    }, 0) || 0

    const freeLabel = formatMessage({
        defaultMessage: 'Free',
        id: 'checkout_confirmation.label.free'
    })

    // Check if all shipments have valid shipping info
    const hasValidShippingInfo = shipmentsWithAddresses.length > 0 && 
        shipmentsWithAddresses.every(s => s.shippingAddress)

    const isFormValid = form.formState.isValid || 
        shipmentsWithAddresses.every(s => s.shippingMethod?.id)

    return (
        <ToggleCard
            id="step-2"
            title={formatMessage({
                defaultMessage: 'Shipping & Gift Options',
                id: 'shipping_options.title.shipping_gift_options'
            })}
            editing={step === STEPS.SHIPPING_OPTIONS}
            isLoading={form.formState.isSubmitting}
            disabled={!hasValidShippingInfo}
            onEdit={() => goToStep(STEPS.SHIPPING_OPTIONS)}
            editLabel={formatMessage({
                defaultMessage: 'Edit Shipping Options',
                id: 'toggle_card.action.editShippingOptions'
            })}
        >
            <ToggleCardEdit>
                <form
                    onSubmit={form.handleSubmit(submitForm)}
                    data-testid="sf-checkout-shipping-options-form"
                >
                    <Stack spacing={6}>
                        {/* Dynamically create shipping method options for each shipment */}
                        {shipmentsWithAddresses.map((shipment) => (
                            <ShipmentOptions
                                key={shipment.shipmentId}
                                shipment={shipment}
                                basketId={basket.basketId}
                                currency={currency}
                                control={form.control}
                                showLabel={shipmentsWithAddresses.length > 1}
                            />
                        ))}
                        
                        <Box>
                            <Container variant="form">
                                <Button 
                                    w="full" 
                                    type="submit"
                                    isDisabled={!isFormValid}
                                >
                                    <FormattedMessage
                                        defaultMessage="Continue to Payment"
                                        id="shipping_options.button.continue_to_payment"
                                    />
                                </Button>
                            </Container>
                        </Box>
                    </Stack>
                </form>
            </ToggleCardEdit>

            {hasValidShippingInfo && (
                <ToggleCardSummary>
                    {shipmentsWithAddresses.length === 1 ? (
                        // Single shipment summary
                        <Box>
                            {shipmentsWithAddresses[0].shippingMethod && (
                                <>
                                    <Flex justify="space-between" w="full">
                                        <Text>{shipmentsWithAddresses[0].shippingMethod.name}</Text>
                                        <Text fontWeight="bold">
                                            {totalShippingCost === 0 ? (
                                                freeLabel
                                            ) : (
                                                <FormattedNumber
                                                    value={totalShippingCost}
                                                    style="currency"
                                                    currency={currency}
                                                />
                                            )}
                                        </Text>
                                    </Flex>
                                    <Text fontSize="sm" color="gray.700">
                                        {shipmentsWithAddresses[0].shippingMethod.description}
                                    </Text>
                                </>
                            )}
                        </Box>
                    ) : (
                        // Multiple shipments summary
                        <Stack spacing={2}>
                            {shipmentsWithAddresses.map((shipment) => {
                                const shippingItem = basket.shippingItems?.find(
                                    item => item.shipmentId === shipment.shipmentId
                                )
                                const itemCost = shippingItem?.priceAfterItemDiscount || shippingItem?.price || 0
                                
                                return shipment.shippingMethod ? (
                                    <Box key={shipment.shipmentId}>
                                        <Flex justify="space-between" w="full">
                                            <Box flex="1">
                                                <Text fontWeight="semibold">
                                                    {formatMessage({
                                                        defaultMessage: 'Delivering to {name}',
                                                        id: 'shipping_options.label.delivering_to'
                                                    }, {
                                                        name: `${shipment.shippingAddress.firstName} ${shipment.shippingAddress.lastName}`
                                                    })}
                                                </Text>
                                                <Text>
                                                    {shipment.shippingAddress.address1}, {shipment.shippingAddress.city}, {shipment.shippingAddress.stateCode} {shipment.shippingAddress.postalCode}
                                                </Text>
                                                <Text mt={2}>
                                                    {shipment.shippingMethod.name}
                                                </Text>
                                                <Text fontSize="sm" color="gray.700">
                                                    {shipment.shippingMethod.description}
                                                </Text> 
                                            </Box>
                                            <Text fontWeight="bold" fontSize="sm">
                                                {itemCost === 0 ? (
                                                    freeLabel
                                                ) : (
                                                    <FormattedNumber
                                                        value={itemCost}
                                                        style="currency"
                                                        currency={currency}
                                                    />
                                                )}
                                            </Text>
                                        </Flex>
                                    </Box>
                                ) : null
                            })}
                            {shipmentsWithAddresses.length > 1 && (
                                <Box borderTopWidth="1px" pt={2} mt={2}>
                                    <Flex justify="space-between" w="full">
                                        <Text fontWeight="semibold">
                                            {formatMessage({
                                                defaultMessage: 'Total Shipping',
                                                id: 'shipping_options.label.total_shipping'
                                            })}
                                        </Text>
                                        <Text fontWeight="bold">
                                            <FormattedNumber
                                                value={totalShippingCost}
                                                style="currency"
                                                currency={currency}
                                            />
                                        </Text>
                                    </Flex>
                                </Box>
                            )}
                        </Stack>
                    )}
                </ToggleCardSummary>
            )}
        </ToggleCard>
    )
}
