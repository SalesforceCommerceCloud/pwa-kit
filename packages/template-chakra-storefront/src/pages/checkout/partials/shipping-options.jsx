/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useMemo} from 'react'
import {FormattedNumber, useIntl} from 'react-intl'
import {Box, Button, Container, Flex, HStack, RadioGroup, Stack, Text} from '@chakra-ui/react'
import {useForm, Controller} from 'react-hook-form'
import {useCheckout} from '../util/checkout-context'
import {ChevronDownIcon} from '../../../components/icons'
import {ToggleCard, ToggleCardEdit, ToggleCardSummary} from '../../../components/toggle-card'
import {
    useShippingMethodsForShipment,
    useShopperBasketsMutation
} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '../../../hooks/use-current-basket'
import {useCurrency} from '../../../hooks'

export default function ShippingOptions() {
    const intl = useIntl()
    const {formatMessage} = intl
    const {step, STEPS, goToStep, goToNextStep} = useCheckout()
    const {data: basket} = useCurrentBasket()
    const {currency} = useCurrency()
    const updateShippingMethod = useShopperBasketsMutation('updateShippingMethodForShipment')
    const {data: shippingMethods} = useShippingMethodsForShipment(
        {
            parameters: {
                basketId: basket?.basketId,
                shipmentId: 'me'
            }
        },
        {
            enabled: Boolean(basket?.basketId) && step === STEPS.SHIPPING_OPTIONS
        }
    )

    const selectedShippingMethod = basket?.shipments?.[0]?.shippingMethod
    const selectedShippingAddress = basket?.shipments?.[0]?.shippingAddress

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

    const submitForm = async ({shippingMethodId}) => {
        await updateShippingMethod.mutateAsync({
            parameters: {
                basketId: basket.basketId,
                shipmentId: 'me'
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

    const messages = useMemo(
        () => ({
            free: formatMessage({
                id: 'checkout_confirmation.label.free',
                defaultMessage: 'Free'
            }),
            title: formatMessage({
                id: 'shipping_options.title.shipping_gift_options',
                defaultMessage: 'Shipping & Gift Options'
            }),
            editLabel: formatMessage({
                id: 'toggle_card.action.editShippingOptions',
                defaultMessage: 'Edit Shipping Options'
            }),
            sendAsGift: formatMessage({
                id: 'shipping_options.action.send_as_a_gift',
                defaultMessage: 'Do you want to send this as a gift?'
            }),
            continueToPayment: formatMessage({
                id: 'shipping_options.button.continue_to_payment',
                defaultMessage: 'Continue to Payment'
            })
        }),
        [intl]
    )

    let shippingPriceLabel = selectedMethodDisplayPrice
    if (selectedMethodDisplayPrice !== shippingItem?.price) {
        const currentPrice =
            selectedMethodDisplayPrice === 0 ? messages.free : selectedMethodDisplayPrice

        shippingPriceLabel = formatMessage(
            {
                id: 'checkout_confirmation.label.shipping.strikethrough.price',
                defaultMessage: 'Originally {originalPrice}, now {newPrice}'
            },
            {
                originalPrice: shippingItem?.price,
                newPrice: currentPrice
            }
        )
    }

    // Note that this card is disabled when there is no shipping address as well as no shipping method.
    // We do this because we apply the default shipping method to the basket before checkout - so when
    // landing on checkout the first time will put you at the first step (contact info), but the shipping
    // method step would appear filled out already. This fix attempts to avoid any confusion in the UI.
    return (
        <ToggleCard
            id="step-2"
            title={messages.title}
            editing={step === STEPS.SHIPPING_OPTIONS}
            isLoading={form.formState.isSubmitting}
            disabled={selectedShippingMethod == null || !selectedShippingAddress}
            onEdit={() => goToStep(STEPS.SHIPPING_OPTIONS)}
            editLabel={messages.editLabel}
        >
            <ToggleCardEdit>
                <form
                    onSubmit={form.handleSubmit(submitForm)}
                    data-testid="sf-checkout-shipping-options-form"
                >
                    <Stack gap={6}>
                        {shippingMethods?.applicableShippingMethods && (
                            <Controller
                                name="shippingMethodId"
                                control={form.control}
                                defaultValue=""
                                render={({field: {value, onChange}}) => (
                                    <RadioGroup.Root
                                        name="shipping-options-radiogroup"
                                        value={value}
                                        onValueChange={(selected) => {
                                            onChange(selected.value) // Chakra v3 radio returns the selected id in an object with a value property
                                        }}
                                    >
                                        <Stack gap={5}>
                                            {shippingMethods.applicableShippingMethods.map(
                                                (opt) => (
                                                    <RadioGroup.Item value={opt.id} key={opt.id}>
                                                        <RadioGroup.ItemHiddenInput />
                                                        <RadioGroup.ItemIndicator colorPalette="blue" />
                                                        <Flex justify="space-between" w="full">
                                                            <HStack>
                                                                <Box>
                                                                    <RadioGroup.ItemText>
                                                                        {opt.name}
                                                                    </RadioGroup.ItemText>
                                                                    <Text
                                                                        fontSize="sm"
                                                                        color="gray.600"
                                                                    >
                                                                        {opt.description}
                                                                    </Text>
                                                                    {opt.shippingPromotions?.map(
                                                                        (promo) => {
                                                                            return (
                                                                                <Text
                                                                                    key={
                                                                                        promo.promotionId
                                                                                    }
                                                                                    fontSize="sm"
                                                                                    color="green.600"
                                                                                >
                                                                                    {
                                                                                        promo.calloutMsg
                                                                                    }
                                                                                </Text>
                                                                            )
                                                                        }
                                                                    )}
                                                                </Box>
                                                            </HStack>
                                                            <Text fontWeight="bold">
                                                                <FormattedNumber
                                                                    value={opt.price}
                                                                    style="currency"
                                                                    currency={currency}
                                                                />
                                                            </Text>
                                                        </Flex>
                                                    </RadioGroup.Item>
                                                )
                                            )}
                                        </Stack>
                                    </RadioGroup.Root>
                                )}
                            />
                        )}

                        <Box>
                            <Button variant="link-blue" size="sm">
                                {messages.sendAsGift}
                                <ChevronDownIcon />
                            </Button>
                        </Box>
                        <Box>
                            <Container variant="form">
                                <Button w="full" type="submit">
                                    {messages.continueToPayment}
                                </Button>
                            </Container>
                        </Box>
                    </Stack>
                </form>
            </ToggleCardEdit>

            {selectedShippingMethod && selectedShippingAddress && (
                <ToggleCardSummary>
                    <Flex justify="space-between" w="full">
                        <Text>{selectedShippingMethod.name}</Text>
                        <Flex alignItems="center" aria-label={shippingPriceLabel} role="group">
                            <Text fontWeight="bold" aria-hidden="true" role="presentation">
                                {selectedMethodDisplayPrice === 0 ? (
                                    messages.free
                                ) : (
                                    <FormattedNumber
                                        value={selectedMethodDisplayPrice}
                                        style="currency"
                                        currency={currency}
                                    />
                                )}
                            </Text>
                            {selectedMethodDisplayPrice !== shippingItem?.price && (
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
                                        value={shippingItem?.price}
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
