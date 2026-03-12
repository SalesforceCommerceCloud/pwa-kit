/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useState, useMemo, useEffect, useRef, forwardRef, useImperativeHandle} from 'react'
import PropTypes from 'prop-types'
import {defineMessage, FormattedMessage, useIntl} from 'react-intl'
import {useQueryClient} from '@tanstack/react-query'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'

import {
    Box,
    Checkbox,
    Heading,
    Stack,
    Text,
    Divider
} from '@salesforce/retail-react-app/app/components/shared/ui'
import {useForm} from 'react-hook-form'
import {useShopperBasketsV2Mutation as useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useCurrentBasket} from '@salesforce/retail-react-app/app/hooks/use-current-basket'
import {useCurrentCustomer} from '@salesforce/retail-react-app/app/hooks/use-current-customer'
import {useCurrency} from '@salesforce/retail-react-app/app/hooks/use-currency'
import {useCheckout} from '@salesforce/retail-react-app/app/pages/checkout/util/checkout-context'
import {usePaymentConfiguration} from '@salesforce/commerce-sdk-react'
import {useSFPaymentsCountry} from '@salesforce/retail-react-app/app/hooks/use-sf-payments-country'
import {
    STATUS_SUCCESS,
    useSFPayments,
    useAutomaticCapture,
    useFutureUsageOffSession
} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'
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
import {
    buildTheme,
    getSFPaymentsInstrument,
    createPaymentInstrumentBody,
    transformPaymentMethodReferences,
    getGatewayFromPaymentMethod
} from '@salesforce/retail-react-app/app/utils/sf-payments-utils'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'
import {PAYMENT_GATEWAYS} from '@salesforce/retail-react-app/app/constants'
import {useCustomerType} from '@salesforce/commerce-sdk-react'

const SFPaymentsSheet = forwardRef((props, ref) => {
    const {onRequiresPayButtonChange, onCreateOrder, onError} = props
    const intl = useIntl()
    const formatMessage = intl.formatMessage
    const queryClient = useQueryClient()
    const navigate = useNavigation()

    const {data: basket} = useCurrentBasket()
    const {isRegistered} = useCustomerType()
    const {
        data: customer,
        isLoading: customerLoading,
        isFetching: customerFetching
    } = useCurrentCustomer(isRegistered ? ['paymentmethodreferences'] : undefined, {
        refetchOnMount: 'always'
    })
    const isCustomerDataLoading = isRegistered && (customerLoading || customerFetching)

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

    const zoneId = paymentConfig?.zoneId
    const cardCaptureAutomatic = useAutomaticCapture()
    const futureUsageOffSession = useFutureUsageOffSession()

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

    const {mutateAsync: failOrder} = useShopperOrdersMutation('failOrder')

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
    const currentBasket = useRef(null)
    const savePaymentMethodRef = useRef(false)
    const updatedOrder = useRef(null)
    const gateway = useRef(null)

    const handlePaymentMethodSelected = (evt) => {
        // Track selected payment method
        paymentMethodType.current = evt.detail.selectedPaymentMethod

        // Determine gateway for selected payment method
        gateway.current = getGatewayFromPaymentMethod(
            paymentMethodType.current,
            paymentConfig?.paymentMethods,
            paymentConfig?.paymentMethodSetAccounts
        )

        if (evt.detail.savePaymentMethodForFutureUse !== undefined) {
            // Track if payment method should be saved for future use
            savePaymentMethodRef.current = evt.detail.savePaymentMethodForFutureUse === true
        }

        if (evt.detail.requiresPayButton !== undefined && onRequiresPayButtonChange) {
            // Notify listener whether pay button is required
            onRequiresPayButtonChange(evt.detail.requiresPayButton)
        }
    }

    const handlePaymentButtonApprove = async (event) => {
        try {
            // Update savePaymentMethodRef only if explicitly provided. May be missing if payment method doesn't
            // support saving. If missing, preserve existing value set by handlePaymentMethodSelected.
            if (event?.detail?.savePaymentMethodForFutureUse !== undefined) {
                savePaymentMethodRef.current = event.detail.savePaymentMethodForFutureUse === true
            }
            updatedOrder.current = await createAndUpdateOrder(
                savePaymentMethodRef.current && isRegistered
            )
            // Clear the ref after successful order creation
            currentBasket.current = null
            navigate(`/checkout/confirmation/${updatedOrder.current.orderNo}`)
        } catch (error) {
            const message = formatMessage({
                id: 'checkout.message.generic_error',
                defaultMessage: 'An unexpected error occurred during checkout.'
            })
            // Use error.message if available, otherwise use the formatted default message
            onError(error.message || message)
        }
    }

    const handlePaymentButtonCancel = async () => {
        const basketToCleanup = currentBasket.current
        if (!basketToCleanup) {
            return
        }
        await removeSFPaymentsInstruments(basketToCleanup)
        // Clear the ref after cleanup
        currentBasket.current = null
        const message = formatMessage({
            id: 'checkout.message.payment_button_cancel',
            defaultMessage:
                'Your attempted payment was unsuccessful. You have not been charged and your order has not been placed.'
        })
        onError(message)
    }

    const removeSFPaymentsInstruments = async (basketToUpdate) => {
        // Find any existing Salesforce Payments instrument in the basket
        const sfPaymentsInstrument = getSFPaymentsInstrument(basketToUpdate)

        // Remove Salesforce Payments instrument if it exists
        if (sfPaymentsInstrument) {
            await removePaymentInstrumentFromBasket({
                parameters: {
                    basketId: basketToUpdate.basketId,
                    paymentInstrumentId: sfPaymentsInstrument.paymentInstrumentId
                }
            })
        }
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

    const createBasketPaymentInstrument = async () => {
        // If successful `onBillingSubmit` returns the updated basket. If the form was invalid on
        // submit, `undefined` is returned.
        const updatedBasket = await onBillingSubmit()

        if (!updatedBasket) {
            throw new Error('Billing form errors')
        }

        // Store the updated basket for potential cleanup on cancel
        currentBasket.current = updatedBasket

        // Remove any existing Salesforce Payments instruments first
        await removeSFPaymentsInstruments(updatedBasket)

        // Create SF Payments basket payment instrument
        return await addPaymentInstrumentToBasket({
            parameters: {basketId: updatedBasket.basketId},
            body: createPaymentInstrumentBody({
                amount: updatedBasket.orderTotal,
                paymentMethodType: paymentMethodType.current,
                zoneId,
                shippingPreference: 'SET_PROVIDED_ADDRESS',
                paymentData: null,
                storePaymentMethod: false,
                futureUsageOffSession,
                paymentMethods: paymentConfig?.paymentMethods,
                paymentMethodSetAccounts: paymentConfig?.paymentMethodSetAccounts,
                isPostRequest: true
            })
        })
    }

    const createIntent = async (paymentData) => {
        if (gateway.current === PAYMENT_GATEWAYS.PAYPAL) {
            // Create SF Payments basket payment instrument referencing PayPal order
            const updatedBasket = await createBasketPaymentInstrument()

            // Find payment instrument in updated basket
            const basketPaymentInstrument = getSFPaymentsInstrument(updatedBasket)

            // Return PayPal order information
            return {
                id: basketPaymentInstrument.paymentReference.paymentReferenceId
            }
        }

        // For Stripe and Adyen, update order payment instrument to create payment
        const shouldSavePaymentMethod = savePaymentMethodRef.current && isRegistered
        updatedOrder.current = await createAndUpdateOrder(shouldSavePaymentMethod, paymentData)

        // Find updated SF Payments payment instrument in updated order
        const orderPaymentInstrument = getSFPaymentsInstrument(updatedOrder.current)

        let paymentIntent
        if (gateway.current === PAYMENT_GATEWAYS.STRIPE) {
            // Track created payment intent
            paymentIntent = {
                id: orderPaymentInstrument.paymentReference.paymentReferenceId,
                client_secret:
                    orderPaymentInstrument?.paymentReference?.gatewayProperties?.stripe
                        ?.clientSecret
            }

            const orderStripeGatewayProperties =
                orderPaymentInstrument?.paymentReference?.gatewayProperties?.stripe || {}
            const setupFutureUsage = orderStripeGatewayProperties?.setupFutureUsage
            if (setupFutureUsage) {
                paymentIntent.setup_future_usage = setupFutureUsage
            }

            // Update the redirect return URL to include the related order no
            config.current.options.returnUrl +=
                '?orderNo=' + encodeURIComponent(updatedOrder.current.orderNo)
        } else if (gateway.current === PAYMENT_GATEWAYS.ADYEN) {
            // Track created Adyen payment
            paymentIntent = {
                pspReference:
                    orderPaymentInstrument.paymentReference.gatewayProperties.adyen
                        .adyenPaymentIntent.id,
                resultCode:
                    orderPaymentInstrument.paymentReference.gatewayProperties.adyen
                        .adyenPaymentIntent.resultCode,
                action: orderPaymentInstrument.paymentReference.gatewayProperties.adyen
                    .adyenPaymentIntent.adyenPaymentIntentAction
            }
        }

        return paymentIntent
    }

    const createAndUpdateOrder = async (shouldSavePaymentMethod = false, paymentData = null) => {
        // Create order from the basket
        let order = await onCreateOrder()

        // Find SF Payments payment instrument in created order
        const orderPaymentInstrument = getSFPaymentsInstrument(order)

        if (gateway.current === PAYMENT_GATEWAYS.ADYEN && paymentData) {
            // Append necessary data to Adyen redirect return URL
            paymentData.returnUrl +=
                '&orderNo=' +
                encodeURIComponent(order.orderNo) +
                '&zoneId=' +
                encodeURIComponent(paymentConfig?.zoneId) +
                '&type=' +
                encodeURIComponent(paymentMethodType.current)
        }

        try {
            // Update order payment instrument to create payment
            const paymentInstrumentBody = createPaymentInstrumentBody({
                amount: order.orderTotal,
                paymentMethodType: paymentMethodType.current,
                zoneId,
                shippingPreference: null,
                paymentData,
                storePaymentMethod: shouldSavePaymentMethod,
                futureUsageOffSession,
                paymentMethods: paymentConfig?.paymentMethods,
                paymentMethodSetAccounts: paymentConfig?.paymentMethodSetAccounts
            })

            order = await updatePaymentInstrumentForOrder({
                parameters: {
                    orderNo: order.orderNo,
                    paymentInstrumentId: orderPaymentInstrument.paymentInstrumentId
                },
                body: paymentInstrumentBody
            })

            return order
        } catch (error) {
            const statusCode = error?.response?.status || error?.status
            const errorMessage = error?.message || error?.response?.data?.message || 'Unknown error'
            const errorDetails = error?.response?.data || error?.body || {}

            logger.error('Failed to patch payment instrument to order', {
                namespace: 'SFPaymentsSheet.createAndUpdateOrder',
                additionalProperties: {
                    statusCode,
                    errorMessage,
                    errorDetails,
                    basketId: currentBasket.current?.basketId,
                    paymentMethodType: paymentMethodType.current,
                    orderTotal: order.orderTotal,
                    shouldSavePaymentMethod,
                    productSubTotal: currentBasket.current?.productSubTotal,
                    error: error
                }
            })
            const createdOrderNo = order.orderNo
            // call failOrder to clean up the order (ex: amount is not valid, zone is not valid etc)
            await failOrder({
                parameters: {
                    orderNo: createdOrderNo,
                    reopenBasket: true
                },
                body: {
                    reasonCode: 'payment_confirm_failure'
                }
            })

            // Show error message to user - order was failed and basket reopened
            const message = formatMessage({
                defaultMessage:
                    'Payment processing failed. Your order has been cancelled and your basket has been restored. Please try again or select a different payment method.',
                id: 'checkout.message.payment_processing_failed'
            })
            onError(message)

            // Attach orderNo to the error so caller knows order was created
            error.orderNo = createdOrderNo
            error.message = message
            throw error
        }
    }

    const confirmPayment = async () => {
        // Create SF Payments basket payment instrument before creating order
        const updatedBasket = await createBasketPaymentInstrument()

        // Create payment billing details from basket
        const billingDetails = {}

        if (updatedBasket.customerInfo) {
            billingDetails.email = updatedBasket.customerInfo.email
        }

        if (updatedBasket.billingAddress) {
            billingDetails.phone = updatedBasket.billingAddress.phone
            billingDetails.name = updatedBasket.billingAddress.fullName
            billingDetails.address = {
                line1: updatedBasket.billingAddress.address1,
                line2: updatedBasket.billingAddress.address2,
                city: updatedBasket.billingAddress.city,
                state: updatedBasket.billingAddress.stateCode,
                postalCode: updatedBasket.billingAddress.postalCode,
                country: updatedBasket.billingAddress.countryCode
            }
        }

        // Create payment shipping details from basket
        const shippingDetails = {}
        if (updatedBasket.shipments?.[0].shippingAddress) {
            shippingDetails.name = updatedBasket.shipments[0].shippingAddress.fullName
            shippingDetails.address = {
                line1: updatedBasket.shipments[0].shippingAddress.address1,
                line2: updatedBasket.shipments[0].shippingAddress.address2,
                city: updatedBasket.shipments[0].shippingAddress.city,
                state: updatedBasket.shipments[0].shippingAddress.stateCode,
                postalCode: updatedBasket.shipments[0].shippingAddress.postalCode,
                country: updatedBasket.shipments[0].shippingAddress.countryCode
            }
        }

        startConfirming(updatedBasket)

        try {
            // Confirm the payment
            const result = await checkoutComponent.current.confirm(
                null,
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
            return updatedOrder.current
        } catch (error) {
            // Only fail order if createAndUpdateOrder succeeded but perhaps confirm fails
            if (updatedOrder.current && !error.orderNo) {
                // createAndUpdateOrder succeeded but confirm failed - need to fail the order
                try {
                    await failOrder({
                        parameters: {
                            orderNo: updatedOrder.current.orderNo,
                            reopenBasket: true
                        },
                        body: {
                            reasonCode: 'payment_confirm_failure'
                        }
                    })
                    logger.info('Order failed successfully after confirm failure', {
                        namespace: 'SFPaymentsSheet.confirmPayment',
                        additionalProperties: {orderNo: updatedOrder.current.orderNo}
                    })

                    // Show error message to user - order was failed and basket reopened
                    const message = formatMessage({
                        defaultMessage:
                            'Payment confirmation failed. Your order has been cancelled and your basket has been restored. Please try again or select a different payment method.',
                        id: 'checkout.message.payment_confirm_failure'
                    })
                    onError(message)
                    error.message = message
                } catch (failOrderError) {
                    logger.error('Failed to fail order after confirm failure', {
                        namespace: 'SFPaymentsSheet.confirmPayment',
                        additionalProperties: {
                            orderNo: updatedOrder.current.orderNo,
                            failOrderError
                        }
                    })
                }
            }
            throw error
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

    const savedPaymentMethods = useMemo(
        () => transformPaymentMethodReferences(customer, paymentConfig),
        [customer, paymentConfig]
    )

    const [paymentStepReached, setPaymentStepReached] = useState(false)
    useEffect(() => {
        if (step === STEPS.PAYMENT) setPaymentStepReached(true)
    }, [step, STEPS])

    useEffect(() => {
        // Mount SFP only when all required data and DOM are ready; otherwise skip or wait for a later run.
        if (!paymentStepReached) return // Only run after user has reached payment step
        if (isCustomerDataLoading) return // Wait for savedPaymentMethods data to load for registered users
        if (checkoutComponent.current) return // Skip if Componenet Already mounted
        if (!sfp) return // Skip if SFP SDK not loaded yet
        if (!metadata) return // Skip if SFP metadata not available yet
        if (!containerElementRef.current) return // Skip if Payment container ref not attached to DOM yet
        if (!paymentConfig) return // Skip if Payment config not loaded yet

        const paymentMethodSetAccounts = (paymentConfig.paymentMethodSetAccounts || []).map(
            (account) => ({
                ...account,
                gatewayId: account.accountId
            })
        )

        const paymentMethodSet = {
            paymentMethods: paymentConfig.paymentMethods,
            paymentMethodSetAccounts: paymentMethodSetAccounts
        }

        config.current = {
            theme: buildTheme(),
            actions: {
                createIntent: createIntent,
                onClick: () => {} // No-op: return empty function since its not applicable and SDK proceeds immediately
            },
            options: {
                useManualCapture: !cardCaptureAutomatic,
                returnUrl: `${window.location.protocol}//${window.location.host}/checkout/payment-processing`,
                showSaveForFutureUsageCheckbox: isRegistered,
                // Suppress "Make payment method default" checkbox since we don't support default SPM yet
                showSaveAsDefaultCheckbox: false,
                savedPaymentMethods: savedPaymentMethods
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

        paymentElement.addEventListener('sfp:paymentmethodselected', handlePaymentMethodSelected)
        paymentElement.addEventListener('sfp:paymentapprove', handlePaymentButtonApprove)
        paymentElement.addEventListener('sfp:paymentcancel', handlePaymentButtonCancel)

        checkoutComponent.current = sfp.checkout(
            metadata,
            paymentMethodSet,
            config.current,
            paymentRequest,
            paymentElement
        )

        return () => {
            checkoutComponent.current?.destroy()
            checkoutComponent.current = null
        }
    }, [
        paymentStepReached,
        isCustomerDataLoading,
        sfp,
        metadata,
        paymentConfig,
        cardCaptureAutomatic
    ])

    useEffect(() => {
        if (checkoutComponent.current && basket?.orderTotal) {
            checkoutComponent.current.updateAmount(basket.orderTotal)
        }
    }, [basket?.orderTotal])

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
            <Box display={step === STEPS.PAYMENT ? 'block' : 'none'}>
                <Box ref={containerElementRef} />
            </Box>
            <ToggleCardEdit>
                <Box mt={-2} mb={4}>
                    <PromoCode {...promoCodeProps} itemProps={{border: 'none'}} />
                </Box>

                <Stack spacing={6}>
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

SFPaymentsSheet.propTypes = {
    onRequiresPayButtonChange: PropTypes.func,
    onCreateOrder: PropTypes.func.isRequired,
    onError: PropTypes.func.isRequired
}

export default SFPaymentsSheet
