/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useMemo, useEffect, useRef, forwardRef, useImperativeHandle} from 'react'
import {defineMessage, FormattedMessage, useIntl} from 'react-intl'
import {useQueryClient} from '@tanstack/react-query'

import {
    Box,
    Checkbox,
    Heading,
    Stack,
    Text,
    Divider
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useForm} from 'react-hook-form'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks/use-currency'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {usePaymentConfiguration} from '@salesforce/commerce-sdk-react'
import {useConfigurations} from '@salesforce/commerce-sdk-react'
import {useSFPaymentsCountry} from '@salesforce/retail-react-app/app/hooks/use-sf-payments-country'
import {STATUS_SUCCESS, useSFPayments} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'
import {useShopperOrdersMutation} from '@salesforce/commerce-sdk-react'
import {
    ToggleCard,
    ToggleCardEdit,
    ToggleCardSummary
} from '@salesforce/retail-react-app/app/components/toggle-card'
import ShippingAddressSelection from '@salesforce/retail-react-app/app/pages/checkout/partials/shipping-address-selection'
import AddressDisplay from '@salesforce/retail-react-app/app/components/address-display'
import {PromoCode, usePromoCode} from '@salesforce/retail-react-app/app/components/promo-code'
import {isPickupShipment} from '@salesforce/retail-react-app/app/utils/shipment-utils'
import {buildTheme} from '@salesforce/retail-react-app/app/utils/sf-payments-utils'

const SFPaymentsSheet = forwardRef((props, ref) => {
    const intl = useIntl()
    const formatMessage = intl.formatMessage
    const queryClient = useQueryClient()

    const {data: basket} = useCurrentBasket()
    const isPickupOnly =
        basket?.shipments?.length > 0 &&
        basket.shipments.every((shipment) => isPickupShipment(shipment))
    const selectedShippingAddress = useMemo(() => {
        if (!basket?.shipments?.length || isPickupOnly) return null
        const deliveryShipment = basket.shipments.find((shipment) => !isPickupShipment(shipment))
        return deliveryShipment?.shippingAddress || null
    }, [basket?.shipments, isPickupShipment, isPickupOnly])

    const selectedBillingAddress = basket?.billingAddress
    const [billingSameAsShipping, setBillingSameAsShipping] = useState(!isPickupOnly)
    const {currency} = useCurrency()
    const {countryCode} = useSFPaymentsCountry()
    const {sfp, metadata, startConfirming, endConfirming} = useSFPayments()

    const {data: paymentConfig} = usePaymentConfiguration({
        parameters: {
            currency,
            countryCode: basket?.countryCode || countryCode || 'US' // TODO: remove US when parameter made optional
        }
    })

    const {data: shopperConfigurations} = useConfigurations()

    // Helper function to get configuration value by id
    const getConfigurationValue = (id, defaultValue = null) => {
        if (!shopperConfigurations?.configurations) return defaultValue
        const config = shopperConfigurations.configurations.find((c) => c.id === id)
        return config ? config.value : defaultValue
    }

    useEffect(() => {
        if (isPickupOnly) {
            setBillingSameAsShipping(false)
        }
    }, [isPickupOnly])

    const {mutateAsync: addPaymentInstrumentToBasket} = useShopperBasketsMutation(
        'addPaymentInstrumentToBasket'
    )
    const {mutateAsync: updatePaymentInstrumentForOrder} = useShopperOrdersMutation(
        'updatePaymentInstrumentForOrder'
    )
    const {mutateAsync: updateBillingAddressForBasket} = useShopperBasketsMutation(
        'updateBillingAddressForBasket'
    )
    const {mutateAsync: removePaymentInstrumentFromBasket} = useShopperBasketsMutation(
        'removePaymentInstrumentFromBasket'
    )

    const {step, STEPS, goToStep} = useCheckout()

    const billingAddressForm = useForm({
        mode: 'onChange',
        shouldUnregister: false,
        defaultValues: {...selectedBillingAddress}
    })

    // Using destructuring to remove properties from the object...
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const {removePromoCode, ...promoCodeProps} = usePromoCode()

    const containerElementRef = useRef(null)
    const config = useRef(null)
    const checkoutComponent = useRef(null)
    const paymentMethodType = useRef(null)

    const handlePaymentMethodSelected = (evt) => {
        paymentMethodType.current = evt.detail.selectedPaymentMethod
    }

    const onBillingSubmit = async () => {
        const isFormValid = await billingAddressForm.trigger()

        if (!isFormValid) {
            return
        }
        const billingAddress = billingSameAsShipping
            ? selectedShippingAddress
            : billingAddressForm.getValues()
        // Using destructuring to remove properties from the object...
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const {addressId, creationDate, lastModified, preferred, ...address} = billingAddress
        return await updateBillingAddressForBasket({
            body: address,
            parameters: {basketId: basket.basketId}
        })
    }

    const confirmPayment = async (createOrder) => {
        // If successful `onBillingSubmit` returns the updated basket. If the form was invalid on
        // submit, `undefined` is returned.
        const updatedBasket = await onBillingSubmit()

        if (!updatedBasket) {
            throw new Error('Billing form errors')
        }

        startConfirming(updatedBasket)

        // Create SF Payments basket payment instrument before creating order
        const basketPaymentInstrument = {
            paymentMethodId: 'Salesforce Payments',
            amount: updatedBasket.orderTotal
        }

        await addPaymentInstrumentToBasket({
            parameters: {basketId: updatedBasket.basketId},
            body: basketPaymentInstrument
        })

        // Create order from the basket
        const order = await createOrder()

        // Find SF Payments payment instrument in created order
        let orderPaymentInstrument = order.paymentInstruments.find(
            (pi) => pi.paymentMethodId === 'Salesforce Payments'
        )

        try {
            // Update order payment instrument to create payment
            const updatedOrder = await updatePaymentInstrumentForOrder({
                parameters: {
                    orderNo: order.orderNo,
                    paymentInstrumentId: orderPaymentInstrument.paymentInstrumentId
                },
                body: {
                    paymentMethodId: 'Salesforce Payments',
                    amount: order.orderTotal,
                    paymentReferenceRequest: {
                        paymentMethodType: paymentMethodType.current,
                        zoneId: getConfigurationValue('zoneId', 'default')
                    }
                }
            })

            // Find updated SF Payments payment instrument in updated order
            orderPaymentInstrument = updatedOrder.paymentInstruments.find(
                (pi) => pi.paymentInstrumentId === orderPaymentInstrument.paymentInstrumentId
            )

            // Track created payment intent
            const paymentIntent = {
                client_secret: orderPaymentInstrument.paymentReference.clientSecret,
                id: orderPaymentInstrument.paymentReference.paymentReferenceId
            }

            // Create payment billing details from basket
            const billingDetails = {}

            if (updatedOrder.customerInfo) {
                billingDetails.email = updatedOrder.customerInfo.email
            }

            if (updatedOrder.billingAddress) {
                billingDetails.phone = updatedOrder.billingAddress.phone
                billingDetails.name = updatedOrder.billingAddress.fullName
                billingDetails.address = {
                    line1: updatedOrder.billingAddress.address1,
                    line2: updatedOrder.billingAddress.address2,
                    city: updatedOrder.billingAddress.city,
                    state: updatedOrder.billingAddress.stateCode,
                    postalCode: updatedOrder.billingAddress.postalCode,
                    country: updatedOrder.billingAddress.countryCode
                }
            }

            // Create payment shipping details from basket
            const shippingDetails = {}
            if (updatedOrder.shipments?.[0].shippingAddress) {
                shippingDetails.name = updatedOrder.shipments[0].shippingAddress.fullName
                shippingDetails.address = {
                    line1: updatedOrder.shipments[0].shippingAddress.address1,
                    line2: updatedOrder.shipments[0].shippingAddress.address2,
                    city: updatedOrder.shipments[0].shippingAddress.city,
                    state: updatedOrder.shipments[0].shippingAddress.stateCode,
                    postalCode: updatedOrder.shipments[0].shippingAddress.postalCode,
                    country: updatedOrder.shipments[0].shippingAddress.countryCode
                }
            }

            // Update the redirect return URL to include the related order no
            config.current.options.returnUrl += '?orderNo=' + order.orderNo

            // Confirm the payment
            const result = await checkoutComponent.current.confirm(
                () => paymentIntent,
                billingDetails,
                shippingDetails
            )
            if (result.responseCode !== STATUS_SUCCESS) {
                throw new Error(result.data?.error)
            }

            // Ensure updated order state shown on confirmation page
            // TODO: only invalidate order queries
            queryClient.invalidateQueries()
            // Finally return the created order
            return order
        } finally {
            // Remove tracked basket being confirmed
            endConfirming()
        }
    }

    const billingAddressAriaLabel = defineMessage({
        defaultMessage: 'Billing Address Form',
        id: 'checkout_payment.label.billing_address_form'
    })

    useImperativeHandle(ref, () => ({
        confirmPayment
    }))

    useEffect(() => {
        if (
            sfp &&
            metadata &&
            containerElementRef.current &&
            paymentConfig &&
            shopperConfigurations
        ) {
            const paymentMethodSet = {
                paymentMethods: paymentConfig.paymentMethods,
                paymentMethodSetAccounts: paymentConfig.paymentMethodSetAccounts
            }

            config.current = {
                theme: buildTheme(),
                actions: {},
                options: {
                    useManualCapture: !getConfigurationValue('cardCaptureAutomatic', true),
                    returnUrl: `${window.location.protocol}//${window.location.host}/checkout/payment-processing`
                }
            }

            const paymentRequest = {
                amount: basket.productTotal,
                currency: basket.currency,
                country: 'US', // TODO: see W-18812582
                locale: intl.locale
            }

            // Clear the container and create a new div element
            containerElementRef.current.innerHTML = ''
            const paymentElement = document.createElement('div')
            containerElementRef.current.appendChild(paymentElement)

            paymentElement.addEventListener('load', handlePaymentMethodSelected)
            paymentElement.addEventListener('paymentMethodSelected', handlePaymentMethodSelected)

            checkoutComponent.current = sfp.checkout(
                metadata,
                paymentMethodSet,
                config.current,
                paymentRequest,
                paymentElement
            )
        }

        // Cleanup on unmount
        return () => {
            checkoutComponent.current?.destroy()
            checkoutComponent.current = null
        }
    }, [sfp, metadata, containerElementRef.current, paymentConfig, shopperConfigurations])

    return (
        <ToggleCard
            id="step-3"
            title={formatMessage({defaultMessage: 'Payment', id: 'checkout_payment.title.payment'})}
            editing={step === STEPS.PAYMENT}
            isLoading={billingAddressForm.formState.isSubmitting}
            disabled={true}
            onEdit={() => goToStep(STEPS.PAYMENT)}
            editLabel={formatMessage({
                defaultMessage: 'Edit Payment Info',
                id: 'toggle_card.action.editPaymentInfo'
            })}
        >
            <ToggleCardEdit>
                <Box mt={-2} mb={4}>
                    <PromoCode {...promoCodeProps} itemProps={{border: 'none'}} />
                </Box>

                <Stack spacing={6}>
                    <Box ref={containerElementRef} />

                    <Divider borderColor="gray.100" />

                    <Stack spacing={2}>
                        <Heading as="h3" fontSize="md">
                            <FormattedMessage
                                defaultMessage="Billing Address"
                                id="checkout_payment.heading.billing_address"
                            />
                        </Heading>

                        {!isPickupOnly && (
                            <Checkbox
                                name="billingSameAsShipping"
                                isChecked={billingSameAsShipping}
                                onChange={(e) => setBillingSameAsShipping(e.target.checked)}
                            >
                                <Text fontSize="sm" color="gray.700">
                                    <FormattedMessage
                                        defaultMessage="Same as shipping address"
                                        id="checkout_payment.label.same_as_shipping"
                                    />
                                </Text>
                            </Checkbox>
                        )}

                        {billingSameAsShipping && selectedShippingAddress && (
                            <Box pl={7}>
                                <AddressDisplay address={selectedShippingAddress} />
                            </Box>
                        )}
                    </Stack>

                    {!billingSameAsShipping && (
                        <ShippingAddressSelection
                            form={billingAddressForm}
                            selectedAddress={selectedBillingAddress}
                            formTitleAriaLabel={billingAddressAriaLabel}
                            hideSubmitButton
                            isBillingAddress
                        />
                    )}
                </Stack>
            </ToggleCardEdit>

            <ToggleCardSummary>
                <Stack spacing={6}>
                    {selectedBillingAddress && (
                        <Stack spacing={2}>
                            <Heading as="h3" fontSize="md">
                                <FormattedMessage
                                    defaultMessage="Billing Address"
                                    id="checkout_payment.heading.billing_address"
                                />
                            </Heading>
                            <AddressDisplay address={selectedBillingAddress} />
                        </Stack>
                    )}
                </Stack>
            </ToggleCardSummary>
        </ToggleCard>
    )
})

SFPaymentsSheet.displayName = 'SFPaymentsSheet'

export default SFPaymentsSheet
