/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useState, useMemo} from 'react'
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
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout-one-click/util/checkout-context'
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
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import {isPickupShipment} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import PropTypes from 'prop-types'

export default function ShippingOptions() {
    const {formatMessage} = useIntl()
    const {step, STEPS, goToStep, goToNextStep} = useCheckout()
    const {data: basket} = useCurrentBasket()
    const {data: customer} = useCurrentCustomer()
    const {currency} = useCurrency()
    const updateShippingMethod = useShopperBasketsMutation('updateShippingMethodForShipment')
    const [hasAutoSelected, setHasAutoSelected] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    // Identify delivery shipments (exclude pickup)
    const deliveryShipments = basket?.shipments?.filter((s) => !isPickupShipment(s)) || []
    const hasMultipleDeliveryShipments = deliveryShipments.length > 1
    const targetDeliveryShipment = hasMultipleDeliveryShipments ? null : deliveryShipments[0]

    const {data: shippingMethods} = useShippingMethodsForShipment(
        {
            parameters: {
                basketId: basket?.basketId,
                shipmentId: targetDeliveryShipment?.shipmentId || 'me'
            }
        },
        {
            enabled:
                Boolean(basket?.basketId) &&
                step === STEPS.SHIPPING_OPTIONS &&
                !hasMultipleDeliveryShipments
        }
    )

    const selectedShippingMethod = targetDeliveryShipment?.shippingMethod
    const selectedShippingAddress = targetDeliveryShipment?.shippingAddress

    // Calculate if we should show loading state immediately for auto-selection
    const shouldShowInitialLoading = useMemo(() => {
        return (
            step === STEPS.SHIPPING_OPTIONS &&
            !hasAutoSelected &&
            customer?.isRegistered &&
            !selectedShippingMethod?.id &&
            shippingMethods?.applicableShippingMethods?.length &&
            shippingMethods.defaultShippingMethodId &&
            shippingMethods.applicableShippingMethods.find(
                (method) => method.id === shippingMethods.defaultShippingMethodId
            )
        )
    }, [step, hasAutoSelected, customer, selectedShippingMethod, shippingMethods])

    // Use calculated loading state or manual loading state
    const effectiveIsLoading = Boolean(isLoading) || Boolean(shouldShowInitialLoading)

    const form = useForm({
        shouldUnregister: false,
        defaultValues: {
            shippingMethodId: selectedShippingMethod?.id || shippingMethods?.defaultShippingMethodId
        }
    })

    useEffect(() => {
        const defaultMethodId = shippingMethods?.defaultShippingMethodId
        const methodId = form.getValues().shippingMethodId
        if (!selectedShippingMethod && !methodId && defaultMethodId) {
            form.reset({shippingMethodId: defaultMethodId})
        }

        if (selectedShippingMethod && methodId !== selectedShippingMethod.id) {
            form.reset({shippingMethodId: selectedShippingMethod.id})
        }
    }, [selectedShippingMethod, shippingMethods])

    // Validate existing shipping method for new address or auto-select default for authenticated users
    useEffect(() => {
        const handleShippingMethodForReturningShopper = async () => {
            // Only auto-select when on this step and haven't already auto-selected
            if (step !== STEPS.SHIPPING_OPTIONS || hasAutoSelected || isLoading) {
                return
            }

            // Wait for shipping methods to load
            if (!shippingMethods?.applicableShippingMethods?.length) {
                return
            }

            const applicable = shippingMethods.applicableShippingMethods

            // If we already have a shipping method on the basket, validate it against the new address' methods.
            if (selectedShippingMethod?.id) {
                const stillValid = applicable.some((m) => m.id === selectedShippingMethod.id)
                setHasAutoSelected(true)
                if (stillValid) {
                    // Do not update the basket – keep existing method and proceed to payment
                    goToNextStep()
                    return
                }
                // If existing method is no longer valid, fall through to select/apply a default
            }

            // Only proceed with auto-apply for authenticated users when no valid method is present
            if (!customer?.isRegistered) {
                return
            }

            const defaultMethodId = shippingMethods.defaultShippingMethodId
            const defaultMethod =
                applicable.find((method) => method.id === defaultMethodId) || applicable[0]

            if (defaultMethod) {
                //Auto-selecting default shipping method
                setHasAutoSelected(true)
                setIsLoading(true) // Show loading state immediately

                try {
                    // Apply the default shipping method and continue to next step
                    await updateShippingMethod.mutateAsync({
                        parameters: {
                            basketId: basket.basketId,
                            shipmentId: targetDeliveryShipment?.shipmentId || 'me'
                        },
                        body: {
                            id: defaultMethodId
                        }
                    })
                    //Default shipping method auto-applied successfully
                    setIsLoading(false) // Clear loading state before navigation
                    goToNextStep()
                } catch (error) {
                    // Reset on error so user can manually select
                    setHasAutoSelected(false)
                    setIsLoading(false) // Hide loading state on error
                }
            }
        }

        handleShippingMethodForReturningShopper()
    }, [
        step,
        selectedShippingMethod,
        customer,
        shippingMethods,
        hasAutoSelected,
        basket?.basketId,
        isLoading,
        goToNextStep,
        updateShippingMethod
    ])

    const submitForm = async ({shippingMethodId}) => {
        if (basket?.shipments?.shippingMethod?.length > 0) {
            await updateShippingMethod.mutateAsync({
                parameters: {
                    basketId: basket.basketId,
                    shipmentId: targetDeliveryShipment?.shipmentId || 'me'
                },
                body: {
                    id: shippingMethodId
                }
            })
        }
        goToNextStep()
    }

    const shippingItem = basket?.shippingItems?.[0]

    const selectedMethodDisplayPrice = Math.min(
        shippingItem?.price || 0,
        shippingItem?.priceAfterItemDiscount || 0
    )

    const freeLabel = formatMessage({
        defaultMessage: 'Free',
        id: 'checkout_confirmation.label.free'
    })

    let shippingPriceLabel = selectedMethodDisplayPrice
    if (selectedMethodDisplayPrice !== shippingItem.price) {
        const currentPrice =
            selectedMethodDisplayPrice === 0 ? freeLabel : selectedMethodDisplayPrice

        shippingPriceLabel = formatMessage(
            {
                defaultMessage: 'Originally {originalPrice}, now {newPrice}',
                id: 'checkout_confirmation.label.shipping.strikethrough.price'
            },
            {
                originalPrice: shippingItem.price,
                newPrice: currentPrice
            }
        )
    }

    return (
        <ToggleCard
            id="step-2"
            title={formatMessage({
                defaultMessage: 'Shipping & Gift Options',
                id: 'shipping_options.title.shipping_method'
            })}
            editing={step === STEPS.SHIPPING_OPTIONS}
            isLoading={form.formState.isSubmitting || effectiveIsLoading}
            disabled={
                (!hasMultipleDeliveryShipments &&
                    (selectedShippingMethod == null || !selectedShippingAddress)) ||
                effectiveIsLoading
            }
            onEdit={() => goToStep(STEPS.SHIPPING_OPTIONS)}
            editLabel={formatMessage({
                defaultMessage: 'Edit Shipping Options',
                id: 'toggle_card.action.editShippingOptions'
            })}
        >
            <ToggleCardEdit>
                {hasMultipleDeliveryShipments ? (
                    <Stack spacing={8}>
                        {deliveryShipments.map((shipment, idx) => (
                            <ShipmentMethods
                                key={shipment.shipmentId}
                                index={idx + 1}
                                shipment={shipment}
                                currency={currency}
                            />
                        ))}
                        <Box>
                            <Container variant="form">
                                <Button w="full" onClick={() => goToNextStep()}>
                                    <FormattedMessage
                                        defaultMessage="Continue to Payment"
                                        id="shipping_options.button.continue_to_payment"
                                    />
                                </Button>
                            </Container>
                        </Box>
                    </Stack>
                ) : (
                    <form
                        onSubmit={form.handleSubmit(submitForm)}
                        data-testid="sf-checkout-shipping-options-form"
                    >
                        <Stack spacing={6}>
                            {shippingMethods?.applicableShippingMethods && (
                                <Controller
                                    name="shippingMethodId"
                                    control={form.control}
                                    defaultValue=""
                                    render={({field: {value, onChange}}) => (
                                        <RadioGroup
                                            name="shipping-options-radiogroup"
                                            value={value}
                                            onChange={onChange}
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
                                                            {opt.shippingPromotions?.map(
                                                                (promo) => (
                                                                    <Text
                                                                        key={promo.promotionId}
                                                                        fontSize="sm"
                                                                        color="green.600"
                                                                    >
                                                                        {promo.calloutMsg}
                                                                    </Text>
                                                                )
                                                            )}
                                                        </Radio>
                                                    )
                                                )}
                                            </Stack>
                                        </RadioGroup>
                                    )}
                                />
                            )}
                            <Box>
                                <Button variant="link" size="sm" rightIcon={<ChevronDownIcon />}>
                                    <FormattedMessage
                                        defaultMessage="Do you want to send this as a gift?"
                                        id="shipping_options.action.send_as_a_gift"
                                    />
                                </Button>
                            </Box>
                            <Box>
                                <Container variant="form">
                                    <Button w="full" type="submit">
                                        <FormattedMessage
                                            defaultMessage="Continue to Payment"
                                            id="shipping_options.button.continue_to_payment"
                                        />
                                    </Button>
                                </Container>
                            </Box>
                        </Stack>
                    </form>
                )}
            </ToggleCardEdit>

            {!hasMultipleDeliveryShipments &&
                !effectiveIsLoading &&
                selectedShippingMethod &&
                selectedShippingAddress && (
                    <ToggleCardSummary>
                        <Flex justify="space-between" w="full">
                            <Text>{selectedShippingMethod.name}</Text>
                            <Flex alignItems="center" aria-label={shippingPriceLabel} role="group">
                                <Text fontWeight="bold" aria-hidden="true" role="presentation">
                                    {selectedMethodDisplayPrice === 0 ? (
                                        freeLabel
                                    ) : (
                                        <FormattedNumber
                                            value={selectedMethodDisplayPrice}
                                            style="currency"
                                            currency={currency}
                                        />
                                    )}
                                </Text>
                                {selectedMethodDisplayPrice !== shippingItem.price && (
                                    <Text
                                        fontWeight="normal"
                                        textDecoration="line-through"
                                        color="gray.600"
                                        marginLeft={1}
                                        aria-hidden="true"
                                        role="presentation"
                                    >
                                        <FormattedNumber
                                            style="currency"
                                            currency={currency}
                                            value={shippingItem.price}
                                        />
                                    </Text>
                                )}
                            </Flex>
                        </Flex>
                        <Text fontSize="sm" color="gray.700">
                            {selectedShippingMethod.description}
                        </Text>
                        {shippingItem?.priceAdjustments?.map((adjustment) => {
                            return (
                                <Text
                                    key={adjustment.priceAdjustmentId}
                                    fontSize="sm"
                                    color="green.600"
                                >
                                    {adjustment.itemText}
                                </Text>
                            )
                        })}
                    </ToggleCardSummary>
                )}
        </ToggleCard>
    )
}

const ShipmentMethods = ({shipment, index, currency}) => {
    const {formatMessage} = useIntl()
    const {data: basket} = useCurrentBasket()
    const updateShippingMethod = useShopperBasketsMutation('updateShippingMethodForShipment')
    const {data: methods} = useShippingMethodsForShipment(
        {
            parameters: {
                basketId: basket?.basketId,
                shipmentId: shipment.shipmentId
            }
        },
        {enabled: Boolean(basket?.basketId && shipment?.shipmentId)}
    )
    const [selected, setSelected] = useState(
        shipment?.shippingMethod?.id || methods?.defaultShippingMethodId
    )

    useEffect(() => {
        const defaultId = shipment?.shippingMethod?.id || methods?.defaultShippingMethodId
        if (!selected && defaultId) {
            setSelected(defaultId)
            try {
                updateShippingMethod.mutateAsync({
                    parameters: {basketId: basket.basketId, shipmentId: shipment.shipmentId},
                    body: {id: defaultId}
                })
            } catch {
                // Ignore; user can manually select another method
            }
        }
    }, [methods, shipment?.shippingMethod?.id])

    const address = shipment?.shippingAddress
    const addressLine = address
        ? `${address.firstName} ${address.lastName}, ${address.address1}, ${address.city}, ${address.stateCode}, ${address.postalCode}`
        : ''

    return (
        <Box>
            <Text fontWeight="bold" mb={2}>
                {formatMessage(
                    {
                        defaultMessage: 'Shipment {index}:',
                        id: 'shipping_options.label.shipment_number'
                    },
                    {index}
                )}
            </Text>
            {addressLine && (
                <Text color="gray.700" mb={3}>
                    {addressLine}
                </Text>
            )}

            {methods?.applicableShippingMethods && (
                <RadioGroup
                    name={`shipping-options-${shipment.shipmentId}`}
                    value={selected}
                    onChange={async (val) => {
                        setSelected(val)
                        try {
                            await updateShippingMethod.mutateAsync({
                                parameters: {
                                    basketId: basket.basketId,
                                    shipmentId: shipment.shipmentId
                                },
                                body: {id: val}
                            })
                        } catch {
                            // Ignore; allow user to retry selection
                        }
                    }}
                >
                    <Stack spacing={5}>
                        {methods.applicableShippingMethods.map((opt) => (
                            <Radio value={opt.id} key={opt.id}>
                                <Flex justify="space-between" w="full">
                                    <Box>
                                        <Text>{opt.name}</Text>
                                        <Text fontSize="sm" color="gray.600">
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
                                {opt.shippingPromotions?.map((promo) => (
                                    <Text key={promo.promotionId} fontSize="sm" color="green.600">
                                        {promo.calloutMsg}
                                    </Text>
                                ))}
                            </Radio>
                        ))}
                    </Stack>
                </RadioGroup>
            )}

            <Box mt={4}>
                <Button variant="link" size="sm" rightIcon={<ChevronDownIcon />}>
                    <FormattedMessage
                        defaultMessage="Send as a gift (gift wrapping)"
                        id="shipping_options.action.send_as_gift_wrapping"
                    />
                </Button>
                <Text fontSize="sm" color="gray.500">
                    <FormattedMessage
                        defaultMessage="You can enable or disable notifications at any time."
                        id="shipping_options.help.notifications"
                    />
                </Text>
            </Box>
        </Box>
    )
}

ShipmentMethods.propTypes = {
    shipment: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired
}
