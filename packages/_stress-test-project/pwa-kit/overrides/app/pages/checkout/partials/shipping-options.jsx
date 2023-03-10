/*
 * Copyright (c) 2021, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect} from 'react'
import {FormattedMessage, FormattedNumber, useIntl} from 'react-intl'
import {Box, Button, Container, Flex, Radio, RadioGroup, Stack, Text} from '@chakra-ui/react'
import {useForm, Controller} from 'react-hook-form'
import {useCheckout} from '../util/checkout-context'
import {ChevronDownIcon} from '../../../components/icons'
import {ToggleCard, ToggleCardEdit, ToggleCardSummary} from '../../../components/toggle-card'

export default function ShippingOptions() {
    const {formatMessage} = useIntl()

    const {
        basket,
        step,
        checkoutSteps,
        shippingMethods,
        getShippingMethods,
        setCheckoutStep,
        selectedShippingMethod,
        selectedShippingAddress,
        setShippingMethod,
        goToNextStep
    } = useCheckout()

    const form = useForm({
        shouldUnregister: false,
        defaultValues: {
            shippingMethodId: selectedShippingMethod?.id || shippingMethods?.defaultShippingMethodId
        }
    })

    useEffect(() => {
        if (step === checkoutSteps.Shipping_Options) {
            getShippingMethods()
        }
    }, [step])

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
        await setShippingMethod(shippingMethodId)
        goToNextStep()
    }

    const shippingItem = basket?.shippingItems?.[0]

    const selectedMethodDisplayPrice = Math.min(
        shippingItem.price || 0,
        shippingItem.priceAfterItemDiscount || 0
    )

    // Note that this card is disabled when there is no shipping address as well as no shipping method.
    // We do this because we apply the default shipping method to the basket before checkout - so when
    // landing on checkout the first time will put you at the first step (contact info), but the shipping
    // method step would appear filled out already. This fix attempts to avoid any confusion in the UI.
    return (
        <ToggleCard
            id="step-2"
            title={formatMessage({
                defaultMessage: 'Shipping & Gift Options',
                id: 'shipping_options.title.shipping_gift_options'
            })}
            editing={step === checkoutSteps.Shipping_Options}
            isLoading={form.formState.isSubmitting}
            disabled={selectedShippingMethod == null || !selectedShippingAddress}
            onEdit={() => setCheckoutStep(checkoutSteps.Shipping_Options)}
        >
            <ToggleCardEdit>
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
                                render={({value, onChange}) => (
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
                                                                    currency={basket.currency}
                                                                />
                                                            </Text>
                                                        </Flex>

                                                        {opt.shippingPromotions?.map((promo) => {
                                                            return (
                                                                <Text
                                                                    key={promo.promotionId}
                                                                    fontSize="sm"
                                                                    color="green.500"
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
            </ToggleCardEdit>

            {selectedShippingMethod && selectedShippingAddress && (
                <ToggleCardSummary>
                    <Flex justify="space-between" w="full">
                        <Text>{selectedShippingMethod.name}</Text>
                        <Flex alignItems="center">
                            <Text fontWeight="bold">
                                {selectedMethodDisplayPrice === 0 ? (
                                    'Free'
                                ) : (
                                    <FormattedNumber
                                        value={selectedMethodDisplayPrice}
                                        style="currency"
                                        currency={basket.currency}
                                    />
                                )}
                            </Text>
                            {selectedMethodDisplayPrice !== shippingItem.price && (
                                <Text
                                    fontWeight="normal"
                                    textDecoration="line-through"
                                    color="gray.500"
                                    marginLeft={1}
                                >
                                    <FormattedNumber
                                        style="currency"
                                        currency={basket.currency}
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
                                color="green.500"
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
