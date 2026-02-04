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
import {useCheckoutAutoSelect} from '@salesforce/retail-react-app/app/hooks/use-checkout-auto-select'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks'
import {
    isPickupShipment,
    isPickupMethod
} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import PropTypes from 'prop-types'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'

export default function ShippingOptions() {
    const {formatMessage} = useIntl()
    const {step, STEPS, goToStep, goToNextStep} = useCheckout()
    const {
        data: basket,
        derivedData: {totalShippingCost}
    } = useCurrentBasket()
    const {data: customer} = useCurrentCustomer()
    const {currency} = useCurrency()
    const updateShippingMethod = useShopperBasketsMutation('updateShippingMethodForShipment')
    const showToast = useToast()
    const [noMethodsToastShown, setNoMethodsToastShown] = useState(false)
    // Identify delivery shipments (exclude pickup and those without shipping addresses)
    const deliveryShipments =
        basket?.shipments?.filter((s) => s.shippingAddress && !isPickupShipment(s)) || []
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
                !hasMultipleDeliveryShipments,
            onSuccess: (data) => {
                const noMethods =
                    !data?.applicableShippingMethods || data.applicableShippingMethods.length === 0
                if (
                    step === STEPS.SHIPPING_OPTIONS &&
                    !hasMultipleDeliveryShipments &&
                    noMethods &&
                    !noMethodsToastShown
                ) {
                    showToast({
                        title: formatMessage({
                            defaultMessage:
                                'No shipping methods are available for this address. Please enter a different address.',
                            id: 'shipping_options.error.no_shipping_methods'
                        }),
                        status: 'error'
                    })
                    setNoMethodsToastShown(true)
                }
            }
        }
    )

    const selectedShippingMethod = targetDeliveryShipment?.shippingMethod
    const selectedShippingAddress = targetDeliveryShipment?.shippingAddress

    // Filter out pickup methods for delivery shipment
    const deliveryMethods =
        (shippingMethods?.applicableShippingMethods || []).filter(
            (method) => !isPickupMethod(method)
        ) || []

    const {isLoading: isAutoSelectLoading} = useCheckoutAutoSelect({
        currentStep: step,
        targetStep: STEPS.SHIPPING_OPTIONS,
        isCustomerRegistered: customer?.isRegistered,
        items: deliveryMethods,
        getPreferredItem: (methods) => {
            const defaultMethodId = shippingMethods?.defaultShippingMethodId
            return methods.find((m) => m.id === defaultMethodId) || methods[0]
        },
        // Skip auto-apply when a valid method is already selected.
        // When the shopper clicked "Change" to edit shippingoptions, stay on the edit view.
        shouldSkip: () => {
            if (selectedShippingMethod?.id && !isPickupMethod(selectedShippingMethod)) {
                const stillValid = deliveryMethods.some((m) => m.id === selectedShippingMethod.id)
                if (stillValid) return true
            }
            return false
        },
        isAlreadyApplied: () => false,
        applyItem: async (method) => {
            await updateShippingMethod.mutateAsync({
                parameters: {
                    basketId: basket.basketId,
                    shipmentId: targetDeliveryShipment?.shipmentId || 'me'
                },
                body: {id: method.id}
            })
        },
        onSuccess: () => goToNextStep(),
        onError: (error) => {
            console.error('Failed to auto-select shipping method:', error)
        },
        enabled: !hasMultipleDeliveryShipments
    })

    // Calculate if we should show loading state immediately for auto-selection
    const shouldShowInitialLoading = useMemo(() => {
        const filteredMethods =
            shippingMethods?.applicableShippingMethods?.filter(
                (method) => !isPickupMethod(method)
            ) || []
        const defaultMethodId = shippingMethods?.defaultShippingMethodId
        const defaultMethod = defaultMethodId
            ? shippingMethods.applicableShippingMethods?.find(
                  (method) => method.id === defaultMethodId
              )
            : null

        return (
            step === STEPS.SHIPPING_OPTIONS &&
            customer?.isRegistered &&
            !selectedShippingMethod?.id &&
            filteredMethods.length > 0 &&
            defaultMethodId &&
            defaultMethod &&
            !isPickupMethod(defaultMethod)
        )
    }, [step, customer, selectedShippingMethod, shippingMethods, STEPS.SHIPPING_OPTIONS])

    // Use calculated loading state or auto-select loading state only for single-shipment.
    // For multi-shipment, each ShipmentMethods fetches its own methods
    const effectiveIsLoading = hasMultipleDeliveryShipments
        ? false
        : Boolean(isAutoSelectLoading) || Boolean(shouldShowInitialLoading)

    const form = useForm({
        shouldUnregister: false,
        defaultValues: {
            shippingMethodId: selectedShippingMethod?.id || shippingMethods?.defaultShippingMethodId
        }
    })

    useEffect(() => {
        // Filter out pickup methods
        const filteredMethods =
            shippingMethods?.applicableShippingMethods?.filter(
                (method) => !isPickupMethod(method)
            ) || []

        const defaultMethodId = shippingMethods?.defaultShippingMethodId
        // Only use default if it's not a pickup method
        const validDefaultMethodId =
            defaultMethodId &&
            !isPickupMethod(
                shippingMethods.applicableShippingMethods?.find((m) => m.id === defaultMethodId)
            )
                ? defaultMethodId
                : filteredMethods[0]?.id

        const methodId = form.getValues().shippingMethodId
        if (!selectedShippingMethod && !methodId && validDefaultMethodId) {
            form.reset({shippingMethodId: validDefaultMethodId})
        }

        if (
            selectedShippingMethod &&
            !isPickupMethod(selectedShippingMethod) &&
            methodId !== selectedShippingMethod.id
        ) {
            form.reset({shippingMethodId: selectedShippingMethod.id})
        }
        // If there are no applicable methods for the current address, clear the form selection
        if (!filteredMethods.length && methodId) {
            form.reset({shippingMethodId: ''})
        }
    }, [selectedShippingMethod, shippingMethods])

    const submitForm = async ({shippingMethodId}) => {
        await updateShippingMethod.mutateAsync({
            parameters: {
                basketId: basket.basketId,
                shipmentId: targetDeliveryShipment?.shipmentId || 'me'
            },
            body: {
                id: shippingMethodId
            }
        })
        goToNextStep()
    }

    const shippingItem = basket?.shippingItems?.[0]

    const selectedMethodDisplayPrice = Math.min(
        shippingItem?.price || 0,
        shippingItem?.priceAfterItemDiscount || 0
    )

    // Filter out pickup methods for all shipments
    const filteredShippingMethods =
        shippingMethods?.applicableShippingMethods?.filter((method) => !isPickupMethod(method)) ||
        []

    const freeLabel = formatMessage({
        defaultMessage: 'Free',
        id: 'checkout_confirmation.label.free'
    })

    const shippingPriceLabel =
        selectedMethodDisplayPrice === 0
            ? freeLabel
            : formatMessage(
                  {
                      defaultMessage: '{price}',
                      id: 'checkout_confirmation.label.shipping.price'
                  },
                  {
                      price: selectedMethodDisplayPrice
                  }
              )

    return (
        <ToggleCard
            id="step-2"
            title={formatMessage({
                defaultMessage: 'Shipping Options',
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
                            {filteredShippingMethods.length > 0 && (
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
                                                {filteredShippingMethods.map((opt) => (
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
                                                        {opt.shippingPromotions?.map((promo) => (
                                                            <Text
                                                                key={promo.promotionId}
                                                                fontSize="sm"
                                                                color="green.600"
                                                            >
                                                                {promo.calloutMsg}
                                                            </Text>
                                                        ))}
                                                    </Radio>
                                                ))}
                                            </Stack>
                                        </RadioGroup>
                                    )}
                                />
                            )}
                            {filteredShippingMethods.length > 0 && (
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
                            )}
                        </Stack>
                    </form>
                )}
            </ToggleCardEdit>

            {!effectiveIsLoading && hasMultipleDeliveryShipments && (
                <MultiShipmentSummary
                    deliveryShipments={deliveryShipments}
                    totalShippingCost={totalShippingCost}
                    currency={currency}
                    freeLabel={freeLabel}
                />
            )}

            {!hasMultipleDeliveryShipments &&
                !effectiveIsLoading &&
                selectedShippingMethod &&
                selectedShippingAddress && (
                    <SingleShipmentSummary
                        selectedShippingMethod={selectedShippingMethod}
                        selectedMethodDisplayPrice={selectedMethodDisplayPrice}
                        shippingPriceLabel={shippingPriceLabel}
                        currency={currency}
                        freeLabel={freeLabel}
                    />
                )}
        </ToggleCard>
    )
}

// Child component for multi-shipment summary
const MultiShipmentSummary = ({deliveryShipments, totalShippingCost, currency, freeLabel}) => {
    const {formatMessage} = useIntl()

    return (
        <ToggleCardSummary>
            <Stack spacing={2}>
                {deliveryShipments.map((shipment) => {
                    // Use shipment.shippingTotal to include all costs (base + promotions + surcharges + other fees)
                    const itemCost = shipment.shippingTotal || 0
                    return (
                        <Box key={shipment.shipmentId}>
                            <Flex justify="space-between" w="full">
                                <Box flex="1">
                                    {shipment.shippingMethod ? (
                                        <>
                                            <Text mt={2}>{shipment.shippingMethod.name}</Text>
                                            <Text fontSize="sm" color="gray.700">
                                                {shipment.shippingMethod.description}
                                            </Text>
                                        </>
                                    ) : (
                                        <Text mt={2} fontSize="sm" color="gray.500">
                                            {formatMessage({
                                                defaultMessage: 'No shipping method selected',
                                                id: 'shipping_options.label.no_method_selected'
                                            })}
                                        </Text>
                                    )}
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
                    )
                })}
                {deliveryShipments.length > 1 && (
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
        </ToggleCardSummary>
    )
}

MultiShipmentSummary.propTypes = {
    deliveryShipments: PropTypes.arrayOf(
        PropTypes.shape({
            shipmentId: PropTypes.string.isRequired,
            shippingMethod: PropTypes.shape({
                name: PropTypes.string,
                description: PropTypes.string
            }),
            shippingTotal: PropTypes.number
        })
    ).isRequired,
    totalShippingCost: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired,
    freeLabel: PropTypes.string.isRequired
}

// Child component for single-shipment summary
const SingleShipmentSummary = ({
    selectedShippingMethod,
    selectedMethodDisplayPrice,
    shippingPriceLabel,
    currency,
    freeLabel
}) => {
    return (
        <ToggleCardSummary>
            <Flex justify="space-between" w="full">
                <Text>{selectedShippingMethod.name}</Text>
                <Text fontWeight="bold" aria-label={shippingPriceLabel}>
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
            </Flex>
            <Text fontSize="sm" color="gray.700">
                {selectedShippingMethod.description}
            </Text>
        </ToggleCardSummary>
    )
}

SingleShipmentSummary.propTypes = {
    selectedShippingMethod: PropTypes.shape({
        name: PropTypes.string.isRequired,
        description: PropTypes.string
    }).isRequired,
    selectedMethodDisplayPrice: PropTypes.number.isRequired,
    shippingPriceLabel: PropTypes.string.isRequired,
    currency: PropTypes.string.isRequired,
    freeLabel: PropTypes.string.isRequired
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
    const [selected, setSelected] = useState(shipment?.shippingMethod?.id || undefined)
    const [hasAutoSelected, setHasAutoSelected] = useState(false)

    useEffect(() => {
        // Only attempt auto-select when there are applicable methods available and we haven't already auto-selected
        // Filter out pickup methods for multi-shipments
        const applicableMethods =
            methods?.applicableShippingMethods?.filter((method) => !isPickupMethod(method)) || []
        const applicableIds = applicableMethods.map((m) => m.id)
        if (!applicableIds.length || hasAutoSelected) {
            return
        }

        // Determine the method to select:
        // 1. Use existing shipment method if still valid (and not pickup)
        // 2. Use default shipping method if available (and not pickup)
        // 3. Fall back to first available method
        const existingMethodId =
            shipment?.shippingMethod?.id &&
            !isPickupMethod(shipment.shippingMethod) &&
            applicableIds.includes(shipment.shippingMethod.id)
                ? shipment.shippingMethod.id
                : undefined
        const defaultMethodId =
            methods?.defaultShippingMethodId &&
            applicableIds.includes(methods.defaultShippingMethodId) &&
            !isPickupMethod(
                methods.applicableShippingMethods.find(
                    (m) => m.id === methods.defaultShippingMethodId
                )
            )
                ? methods.defaultShippingMethodId
                : undefined
        const firstMethodId = applicableMethods[0]?.id

        const methodToSelect = existingMethodId || defaultMethodId || firstMethodId

        if (methodToSelect && methodToSelect !== shipment?.shippingMethod?.id) {
            setSelected(methodToSelect)
            setHasAutoSelected(true)
            updateShippingMethod
                .mutateAsync({
                    parameters: {basketId: basket.basketId, shipmentId: shipment.shipmentId},
                    body: {id: methodToSelect}
                })
                .catch(() => {
                    // Ignore; user can manually select another method
                })
        } else if (methodToSelect) {
            // Method already set on shipment, just update local state
            setSelected(methodToSelect)
            setHasAutoSelected(true)
        }
    }, [
        methods?.applicableShippingMethods,
        methods?.defaultShippingMethodId,
        shipment?.shippingMethod?.id,
        hasAutoSelected,
        basket?.basketId,
        shipment?.shipmentId
    ])

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

            {(() => {
                // Filter out pickup methods for multi-shipments
                const filteredMethods =
                    methods?.applicableShippingMethods?.filter(
                        (method) => !isPickupMethod(method)
                    ) || []
                return filteredMethods.length > 0 ? (
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
                            {filteredMethods.map((opt) => (
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
                                        <Text
                                            key={promo.promotionId}
                                            fontSize="sm"
                                            color="green.600"
                                        >
                                            {promo.calloutMsg}
                                        </Text>
                                    ))}
                                </Radio>
                            ))}
                        </Stack>
                    </RadioGroup>
                ) : null
            })()}
        </Box>
    )
}

ShipmentMethods.propTypes = {
    shipment: PropTypes.object.isRequired,
    index: PropTypes.number.isRequired,
    currency: PropTypes.string.isRequired
}
