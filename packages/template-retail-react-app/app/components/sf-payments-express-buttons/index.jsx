/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'

import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'
import logger from '@salesforce/retail-react-app/app/utils/logger-instance'
import {DEFAULT_SHIPMENT_ID} from '@salesforce/retail-react-app/app/constants'
import {useShopperBasketsV2Mutation as useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useShopperOrdersMutation} from '@salesforce/commerce-sdk-react'
import {useShippingMethodsForShipmentV2 as useShippingMethodsForShipment} from '@salesforce/commerce-sdk-react'
import {usePaymentConfiguration} from '@salesforce/commerce-sdk-react'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useSFPaymentsCountry} from '@salesforce/retail-react-app/app/hooks/use-sf-payments-country'
import {
    EXPRESS_BUY_NOW,
    EXPRESS_PAY_NOW,
    useSFPayments,
    useAutomaticCapture
} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {
    buildTheme,
    getSFPaymentsInstrument,
    transformAddressDetails,
    transformShippingMethods,
    getSelectedShippingMethodId,
    createPaymentInstrumentBody,
    isPayPalPaymentMethodType,
    getClientSecret,
    getGatewayFromPaymentMethod,
    getExpressPaymentMethodType
} from '@salesforce/retail-react-app/app/utils/sf-payments-utils'
import {PAYMENT_GATEWAYS} from '@salesforce/retail-react-app/app/constants'

/*
  These imports are needed during the failOrder process.  The useAccessToken hook is not a commonly used hook
  BUT it is needed to get the current order details and gaurd the failOrder process from failing
  It's not a new pattern we are introducing: use-einstein.js uses it to get the access token
  We are basically bypassing the React Query Wrapper and going directly to the Commerce API to get the order details
  The React Query hooks are designed for declarative data fetching, so for imperative calls, you use the raw API client, which requires manual auth.
  If we use the React Query hooks, we would need to wait for the query to complete before we can call the failOrder mutation

  The useQueryClient is needed to clear the stale cache when the basket can't be recovered
*/
import {useCommerceApi, useAccessToken} from '@salesforce/commerce-sdk-react'
import {useQueryClient} from '@tanstack/react-query'

const SFPaymentsExpressButtons = ({
    usage,
    paymentCurrency,
    paymentCountryCode,
    initialAmount,
    prepareBasket,
    expressButtonLayout = 'vertical',
    maximumButtonCount = undefined,
    onPaymentMethodsRendered,
    onExpressPaymentCompleted
}) => {
    const intl = useIntl()
    const navigate = useNavigation()
    const toast = useToast()
    const queryClient = useQueryClient()
    const {countryCode: fallbackCountryCode} = useSFPaymentsCountry()
    const {sfp, metadata, startConfirming, endConfirming} = useSFPayments()

    // Fetch payment configuration for the buyer's country. Falls back to 'US' if country
    // detection hasn't resolved yet; React Query will re-fetch with the correct country once available.
    // chances of not having a country code is very low with the country hook, so we can default to 'US'
    const {data: paymentConfig} = usePaymentConfiguration({
        parameters: {
            currency: paymentCurrency,
            countryCode: paymentCountryCode || fallbackCountryCode || 'US'
            //,zoneId: "stripeUSTest" //if you need to test with a different zone
        }
    })

    const cardCaptureAutomatic = useAutomaticCapture()
    const zoneId = paymentConfig?.zoneId

    const {mutateAsync: updateBillingAddressForBasket} = useShopperBasketsMutation(
        'updateBillingAddressForBasket'
    )
    const updateShippingAddressForShipment = useShopperBasketsMutation(
        'updateShippingAddressForShipment'
    )
    const updateShippingMethod = useShopperBasketsMutation('updateShippingMethodForShipment')
    const {mutateAsync: addPaymentInstrumentToBasket} = useShopperBasketsMutation(
        'addPaymentInstrumentToBasket'
    )
    const {mutateAsync: updatePaymentInstrumentForOrder} = useShopperOrdersMutation(
        'updatePaymentInstrumentForOrder'
    )
    const {mutateAsync: createOrder} = useShopperOrdersMutation('createOrder')
    const {mutateAsync: removePaymentInstrumentFromBasket} = useShopperBasketsMutation(
        'removePaymentInstrumentFromBasket'
    )
    const {mutateAsync: deleteBasket} = useShopperBasketsMutation('deleteBasket')

    const {mutateAsync: failOrder} = useShopperOrdersMutation('failOrder')

    const expressBasket = useRef(null)
    const prepareBasketPromise = useRef(null)
    const containerElementRef = useRef(null)
    const expressComponent = useRef(null)
    const prepareBasketRef = useRef(prepareBasket)
    const failOrderCalledRef = useRef(false)
    const orderRef = useRef(null)

    // used to call failOrder
    const api = useCommerceApi()
    const {getTokenWhenReady} = useAccessToken()

    // tracks if payment is in progress
    const isPaymentInProgress = useRef(false)

    // Update the ref whenever prepareBasket changes, including when the variant changes on PDP
    // Using prepareBasketRef.current also ensures the function handlers always call the latest prepareBasket function
    useEffect(() => {
        prepareBasketRef.current = prepareBasket
    }, [prepareBasket])

    const {refetch: refetchShippingMethods} = useShippingMethodsForShipment(
        {
            parameters: {
                basketId: expressBasket.current?.basketId,
                shipmentId: DEFAULT_SHIPMENT_ID
            }
        },
        {
            enabled: Boolean(expressBasket.current?.basketId)
        }
    )

    const ERROR_MESSAGE_KEYS = {
        DEFAULT: 'DEFAULT',
        FAIL_ORDER: 'FAIL_ORDER',
        PREPARE_BASKET: 'PREPARE_BASKET',
        PROCESS_PAYMENT: 'PROCESS_PAYMENT',
        ORDER_RECOVERY_FAILED: 'ORDER_RECOVERY_FAILED'
    }
    const ERROR_MESSAGES = {
        DEFAULT: {
            defaultMessage:
                'Your attempted payment was unsuccessful. You have not been charged and your order has not been placed. Please select a different payment method and submit payment again to complete your checkout and place your order.',
            id: 'sfp_payments_express.error.default'
        },
        FAIL_ORDER: {
            defaultMessage:
                'Payment processing failed. Your order has been cancelled and your basket has been restored. Please try again or select a different payment method.',
            id: 'sfp_payments_express.error.fail_order'
        },
        PREPARE_BASKET: {
            defaultMessage:
                'Unable to prepare basket for express payments. Please select all required product attributes.',
            id: 'sfp_payments_express.error.prepare_basket'
        },
        PROCESS_PAYMENT: {
            defaultMessage:
                'Unable to process payment. Please try again or select a different payment method.',
            id: 'sfp_payments_express.error.process_payment'
        },
        ORDER_RECOVERY_FAILED: {
            defaultMessage:
                'Order recovery failed. Please try again or select a different payment method.',
            id: 'sfp_payments_express.error.order_recovery_failed'
        }
    }

    const showErrorMessage = (messageKey = 'DEFAULT') => {
        // If messageKey is a valid key in ERROR_MESSAGES, use it
        if (ERROR_MESSAGES[messageKey]) {
            toast({
                title: intl.formatMessage(ERROR_MESSAGES[messageKey]),
                status: 'error'
            })
        } else {
            // Otherwise, treat it as a custom error message string
            // (e.g., from e.message) or fallback to DEFAULT if empty
            toast({
                title: messageKey || ERROR_MESSAGES.DEFAULT.defaultMessage,
                status: 'error'
            })
        }
    }

    /**
     * Validate current shipping method is still applicable, update to first applicable if not
     */
    const validateAndUpdateShippingMethod = async (
        basketId,
        currentBasket,
        updatedShippingMethods
    ) => {
        const currentShippingMethodId = currentBasket.shipments[0].shippingMethod?.id

        if (
            !updatedShippingMethods.applicableShippingMethods.find(
                (method) => method.id === currentShippingMethodId
            )
        ) {
            // If the current shipping method isn't set or is inapplicable, set it to the first applicable one
            return await updateShippingMethod.mutateAsync({
                parameters: {
                    basketId: basketId,
                    shipmentId: DEFAULT_SHIPMENT_ID
                },
                body: {
                    id: updatedShippingMethods.applicableShippingMethods[0].id
                }
            })
        }

        return currentBasket
    }

    /**
     * Attempts to fail an order and reopen the basket.
     * Only calls failOrder if the order status supports the transition.
     * @param {string} orderNo - The order number to fail
     * @returns {Promise<boolean>} - true if failOrder succeeded and basket was reopened
     */
    const attemptFailOrder = async (orderNo) => {
        if (!orderNo || failOrderCalledRef.current) {
            return false
        }

        try {
            // Fetch current order status
            const token = await getTokenWhenReady()
            const currentOrder = await api.shopperOrders.getOrder({
                parameters: {orderNo},
                headers: {Authorization: `Bearer ${token}`}
            })

            // Only call failOrder if status allows the transition
            if (currentOrder.status === 'created') {
                await failOrder({
                    parameters: {orderNo, reopenBasket: true},
                    body: {reasonCode: 'payment_confirm_failure'}
                })
                return true // Basket was reopened
            } else {
                return false // Can't recover basket
            }
        } catch (error) {
            return false
        } finally {
            // Mark as attempted to prevent retries
            failOrderCalledRef.current = true
            // Refresh cache to get updated basket state
            queryClient.invalidateQueries()
        }
    }

    /**
     * Create order from basket and update payment instrument
     */
    const createOrderAndUpdatePayment = async (basketId, paymentType, paymentData = {}) => {
        // Create order from the basket
        let order = await createOrder({
            body: {basketId}
        })
        // Store orderNo immediately - basket is consumed at this point
        const createdOrderNo = order.orderNo

        // Find SF Payments payment instrument in created order
        const orderPaymentInstrument = getSFPaymentsInstrument(order)

        // Build the return URL (needed for updatePaymentInstrumentForOrder )
        const baseReturnUrl = `${window.location.protocol}//${window.location.host}/checkout/payment-processing`
        paymentData.returnUrl =
            baseReturnUrl +
            '?orderNo=' +
            encodeURIComponent(createdOrderNo) +
            '&zoneId=' +
            encodeURIComponent(zoneId) +
            '&type=' +
            encodeURIComponent(paymentType)

        try {
            const paymentInstrumentBody = createPaymentInstrumentBody({
                amount: order.orderTotal,
                paymentMethodType: paymentType,
                zoneId: zoneId,
                paymentData: paymentData,
                paymentMethods: paymentConfig?.paymentMethods,
                paymentMethodSetAccounts: paymentConfig?.paymentMethodSetAccounts
            })

            // Update order payment instrument to create payment
            order = await updatePaymentInstrumentForOrder({
                parameters: {
                    orderNo: order.orderNo,
                    paymentInstrumentId: orderPaymentInstrument.paymentInstrumentId
                },
                body: paymentInstrumentBody
            })
        } catch (error) {
            const statusCode = error?.response?.status || error?.status
            const errorMessage = error?.message || error?.response?.data?.message || 'Unknown error'
            const errorDetails = error?.response?.data || error?.body || {}

            logger.error('Failed to patch payment instrument to order', {
                namespace: 'SFPaymentsExpressButtons.createOrderAndUpdatePayment',
                additionalProperties: {
                    statusCode,
                    errorMessage,
                    errorDetails,
                    basketId: expressBasket.current?.basketId,
                    paymentMethodType: paymentType,
                    orderTotal: expressBasket.current?.orderTotal,
                    productSubTotal: expressBasket.current?.productSubTotal,
                    error: error
                }
            })
            const basketRecovered = await attemptFailOrder(createdOrderNo)
            if (basketRecovered) {
                showErrorMessage(ERROR_MESSAGE_KEYS.FAIL_ORDER)
            } else {
                showErrorMessage(ERROR_MESSAGE_KEYS.ORDER_RECOVERY_FAILED)
                if (usage !== EXPRESS_BUY_NOW) {
                    navigate('/cart')
                }
            }
            // Attach orderNo to the error so caller knows order was created
            error.orderNo = createdOrderNo
            throw error
        }

        return order
    }

    const createExpressCallback = (currentBasket, currentShippingMethods) => {
        // Get currently selected shipping method
        const selectedShippingMethodId = getSelectedShippingMethodId(
            currentBasket,
            currentShippingMethods
        )

        // Get representation of applicable shipping methods with the current one sorted at the top
        const expressShippingMethods = transformShippingMethods(
            currentShippingMethods.applicableShippingMethods,
            currentBasket,
            selectedShippingMethodId,
            true
        )

        // Get representation of currently selected shipping method
        const selectedShippingMethod =
            expressShippingMethods.find((method) => method.id === selectedShippingMethodId) ||
            expressShippingMethods[0]

        // Create line items
        const orderTotal = currentBasket?.orderTotal
        const productSubTotal = currentBasket?.productSubTotal
        const total = orderTotal || productSubTotal

        // Validate that total is a valid number
        if (isNaN(total) || total <= 0) {
            logger.error('Invalid total amount', {
                namespace: 'SFPaymentsExpressButtons.createExpressCallback',
                additionalProperties: {orderTotal, productSubTotal, initialAmount, total}
            })
            throw new Error('Invalid basket total amount')
        }

        const lineItems = [
            {
                name: intl.formatMessage({
                    defaultMessage: 'Subtotal',
                    id: 'order_summary.label.subtotal'
                }),
                amount: total.toString()
            }
        ]
        // TODO: add discounts from currentBasket.orderPriceAdjustments
        if (currentBasket.shippingTotal) {
            lineItems.push({
                name: intl.formatMessage({
                    defaultMessage: 'Shipping',
                    id: 'order_summary.label.shipping'
                }),
                amount: currentBasket.shippingTotal.toString()
            })
        }
        if (currentBasket.taxTotal) {
            lineItems.push({
                name: intl.formatMessage({
                    defaultMessage: 'Tax',
                    id: 'order_summary.label.tax'
                }),
                amount: currentBasket.taxTotal.toString()
            })
        }

        return {
            total: total.toString(),
            shippingMethods: expressShippingMethods,
            selectedShippingMethod: selectedShippingMethod,
            lineItems: lineItems
        }
    }

    useEffect(() => {
        // Remove containerElementRef.current from effect dependencies to prevent unnecessary re-renders
        // instead use it in the if statement to check if the container element is attached to the DOM
        if (metadata && sfp && paymentConfig && containerElementRef.current) {
            // Skip re-initialization if payment is in progress
            if (isPaymentInProgress.current && expressComponent.current) {
                return
            }
            if (expressComponent.current) {
                expressComponent.current.destroy()
                expressComponent.current = null
            }

            let paymentMethodType = null
            orderRef.current = null

            const onClick = async (type) => {
                // reset payment, order and failorder flags
                isPaymentInProgress.current = true
                failOrderCalledRef.current = false
                orderRef.current = null

                paymentMethodType = getExpressPaymentMethodType(
                    type,
                    paymentConfig?.paymentMethods,
                    paymentConfig?.paymentMethodSetAccounts
                )
                // For non-PayPal payment methods, prepare basket immediately
                if (!isPayPalPaymentMethodType(paymentMethodType)) {
                    prepareBasketPromise.current = prepareBasketRef.current()

                    // Don't await - call asynchronously to avoid a potential gateway timeout
                    prepareBasketPromise.current
                        .then((basket) => {
                            expressBasket.current = basket
                        })
                        .catch((e) => {
                            prepareBasketPromise.current = null // Clear the promise so handlers don't try to await it
                            // Don't show toast for validation errors
                            if (!e.isValidationError) {
                                showErrorMessage(e.message || ERROR_MESSAGE_KEYS.PREPARE_BASKET)
                            }
                        })
                }
                return {
                    amount: initialAmount.toString(),
                    shippingRates: []
                }
            }

            // Helper function to clean up express basket state
            const cleanupExpressBasket = async () => {
                // If an order was already created, the basket was consumed - don't try to clean it up
                if (orderRef.current) {
                    expressBasket.current = null
                    return
                }
                // Only clean up if no order was created (basket still exists)
                if (expressBasket.current) {
                    const sfPaymentsInstrument = getSFPaymentsInstrument(expressBasket.current)
                    if (sfPaymentsInstrument) {
                        try {
                            expressBasket.current = await removePaymentInstrumentFromBasket({
                                parameters: {
                                    basketId: expressBasket.current.basketId,
                                    paymentInstrumentId: sfPaymentsInstrument.paymentInstrumentId
                                }
                            })
                        } catch (cleanupError) {
                            logger.warn('Failed to remove payment instrument during cleanup', {
                                namespace: 'SFPaymentsExpressButtons.cleanupExpressBasket',
                                additionalProperties: {cleanupError}
                            })
                        }
                    }
                    // Delete the temporary basket if it exists
                    if (expressBasket.current?.basketId && expressBasket.current?.temporaryBasket) {
                        try {
                            await deleteBasket({
                                parameters: {basketId: expressBasket.current.basketId}
                            })
                        } catch (cleanupError) {
                            logger.warn('Failed to delete temporary basket during cleanup', {
                                namespace: 'SFPaymentsExpressButtons.cleanupExpressBasket',
                                additionalProperties: {cleanupError}
                            })
                        }
                    }
                    // Clear the ref after cleanup
                    expressBasket.current = null
                }
            }

            const onCancel = async () => {
                isPaymentInProgress.current = false
                endConfirming()
                await cleanupExpressBasket()
                showErrorMessage(ERROR_MESSAGE_KEYS.DEFAULT)
            }

            const onShippingAddressChange = async (shippingAddress, callback) => {
                try {
                    // Wait for basket to be prepared if it's not ready yet
                    if (prepareBasketPromise.current) {
                        try {
                            expressBasket.current = await prepareBasketPromise.current
                        } catch (e) {
                            // Promise failed - show error and return early
                            callback.updateShippingAddress({
                                errors: ['fail']
                            })
                            return
                        }
                    }
                    // Update the shipping address in the default shipment
                    let updatedBasket = await updateShippingAddressForShipment.mutateAsync({
                        parameters: {
                            basketId: expressBasket.current.basketId,
                            shipmentId: DEFAULT_SHIPMENT_ID,
                            useAsBilling: false
                        },
                        body: {
                            firstName: null,
                            lastName: null,
                            address1: null,
                            address2: null,
                            city: shippingAddress.city,
                            stateCode: shippingAddress.state,
                            postalCode: shippingAddress.postal_code,
                            countryCode: shippingAddress.country,
                            phone: null
                        }
                    })

                    // Fetch applicable shipping methods after address update
                    const {data: updatedShippingMethods} = await refetchShippingMethods()

                    // Validate and update shipping method if needed
                    updatedBasket = await validateAndUpdateShippingMethod(
                        expressBasket.current.basketId,
                        updatedBasket,
                        updatedShippingMethods
                    )

                    const expressCallback = createExpressCallback(
                        updatedBasket,
                        updatedShippingMethods
                    )
                    callback.updateShippingAddress(expressCallback)
                } catch (e) {
                    callback.updateShippingAddress({
                        errors: ['fail']
                    })
                    showErrorMessage()
                }
            }

            const onShippingMethodChange = async (shippingMethod, callback) => {
                try {
                    // Wait for basket to be prepared if it's not ready yet
                    if (prepareBasketPromise.current) {
                        try {
                            expressBasket.current = await prepareBasketPromise.current
                        } catch (e) {
                            // Promise failed - show error and return early
                            callback.updateShippingMethod({
                                errors: ['fail']
                            })
                            return
                        }
                    }

                    // Update the shipping method in the default shipment
                    const updatedBasket = await updateShippingMethod.mutateAsync({
                        parameters: {
                            basketId: expressBasket.current.basketId,
                            shipmentId: DEFAULT_SHIPMENT_ID
                        },
                        body: {
                            id: shippingMethod.id
                        }
                    })
                    // Update expressBasket.current with the fresh basket data
                    expressBasket.current = updatedBasket

                    // Fetch applicable shipping methods after shipping method update
                    const {data: updatedShippingMethods} = await refetchShippingMethods()

                    const expressCallback = createExpressCallback(
                        updatedBasket,
                        updatedShippingMethods
                    )
                    callback.updateShippingMethod(expressCallback)
                } catch (e) {
                    callback.updateShippingMethod({
                        errors: ['fail']
                    })
                    showErrorMessage()
                }
            }
            //Async function to handle before payer approve event.  This is called before payment is confirmed
            const onPayerApprove = async (billingDetails, shippingDetails) => {
                // Set confirmingBasket to show loading spinner during address updates
                startConfirming(expressBasket.current)

                // For non-PayPal methods, if order was already created in createIntentFunction,
                // the basket is consumed and we shouldn't try to update addresses
                if (!isPayPalPaymentMethodType(paymentMethodType) && orderRef.current) {
                    logger.info('Order already created, skipping address updates', {
                        namespace: 'SFPaymentsExpressButtons.onPayerApprove'
                    })
                    return
                }
                try {
                    // Transform both billing and shipping addresses
                    const {billingAddress, shippingAddress} = transformAddressDetails(
                        billingDetails,
                        shippingDetails
                    )

                    // Next update shipping address in basket
                    const updatedBasket = await updateShippingAddressForShipment.mutateAsync({
                        parameters: {
                            basketId: expressBasket.current.basketId,
                            shipmentId: DEFAULT_SHIPMENT_ID,
                            useAsBilling: false
                        },
                        body: shippingAddress
                    })
                    // Update expressBasket.current with the updated basket
                    expressBasket.current = updatedBasket

                    // Update billing address in basket
                    await updateBillingAddressForBasket({
                        parameters: {basketId: expressBasket.current.basketId},
                        body: billingAddress
                    })

                    // For Stripe, create SF Payments basket payment instrument before creating order
                    if (!isPayPalPaymentMethodType(paymentMethodType)) {
                        try {
                            expressBasket.current = await addPaymentInstrumentToBasket({
                                parameters: {basketId: updatedBasket.basketId},
                                body: createPaymentInstrumentBody({
                                    amount:
                                        updatedBasket.orderTotal || updatedBasket.productSubTotal,
                                    paymentMethodType: paymentMethodType,
                                    zoneId: zoneId
                                })
                            })
                        } catch (error) {
                            const statusCode = error?.response?.status || error?.status
                            const errorMessage =
                                error?.message || error?.response?.data?.message || 'Unknown error'
                            const errorDetails = error?.response?.data || error?.body || {}

                            logger.error('Failed to add payment instrument to basket', {
                                namespace: 'SFPaymentsExpressButtons.onPayerApprove',
                                additionalProperties: {
                                    statusCode,
                                    errorMessage,
                                    errorDetails,
                                    basketId: expressBasket.current?.basketId,
                                    paymentMethodType,
                                    orderTotal: expressBasket.current?.orderTotal,
                                    productSubTotal: expressBasket.current?.productSubTotal,
                                    error: error
                                }
                            })
                            showErrorMessage(ERROR_MESSAGE_KEYS.PROCESS_PAYMENT)
                            throw error
                        }
                    }
                } catch (error) {
                    endConfirming()
                    throw error
                }
            }

            /**
             * Ensures a Salesforce Payments payment instrument exists in the basket.
             * If one doesn't exist, removes any existing one and adds a new one.
             * @param {Object} basket - The basket object
             * @param {string} paymentMethodType - Type of payment method
             * @returns {Promise<Object>} Updated basket with payment instrument
             */
            const ensurePaymentInstrumentInBasket = async (basket, paymentMethodType) => {
                // Check if payment instrument already exists
                let sfPaymentsInstrument = getSFPaymentsInstrument(basket)

                if (sfPaymentsInstrument) {
                    // Payment instrument already exists, return basket as-is
                    return basket
                }

                // Remove any existing Salesforce Payments payment instrument first
                sfPaymentsInstrument = getSFPaymentsInstrument(basket)
                if (sfPaymentsInstrument) {
                    basket = await removePaymentInstrumentFromBasket({
                        parameters: {
                            basketId: basket.basketId,
                            paymentInstrumentId: sfPaymentsInstrument.paymentInstrumentId
                        }
                    })
                }

                // Add Salesforce Payments payment instrument to basket
                try {
                    basket = await addPaymentInstrumentToBasket({
                        parameters: {basketId: basket.basketId},
                        body: createPaymentInstrumentBody({
                            amount: basket.orderTotal || basket.productSubTotal,
                            paymentMethodType: paymentMethodType,
                            zoneId: zoneId
                        })
                    })
                } catch (error) {
                    const statusCode = error?.response?.status || error?.status
                    const errorMessage =
                        error?.message || error?.response?.data?.message || 'Unknown error'
                    const errorDetails = error?.response?.data || error?.body || {}

                    logger.error('Failed to add payment instrument to basket', {
                        namespace: 'SFPaymentsExpressButtons.ensurePaymentInstrumentInBasket',
                        additionalProperties: {
                            statusCode,
                            errorMessage,
                            errorDetails,
                            basketId: basket?.basketId,
                            paymentMethodType,
                            orderTotal: basket?.orderTotal,
                            productSubTotal: basket?.productSubTotal,
                            error: error
                        }
                    })
                    showErrorMessage(ERROR_MESSAGE_KEYS.PROCESS_PAYMENT)
                    throw error
                }

                return basket
            }

            const createIntentFunction = async (paymentData = {}) => {
                const gateway = getGatewayFromPaymentMethod(
                    paymentMethodType,
                    paymentConfig?.paymentMethods,
                    paymentConfig?.paymentMethodSetAccounts
                )
                const isAdyen = gateway === PAYMENT_GATEWAYS.ADYEN

                // For PayPal/Venmo, prepare basket here since createIntentFunction is called after button click
                if (isPayPalPaymentMethodType(paymentMethodType)) {
                    const currentBasket = await prepareBasketRef.current()
                    // update expressBasket.current with the fresh basket
                    expressBasket.current = currentBasket
                }

                if (!expressBasket.current) {
                    logger.error('Basket not ready', {
                        namespace: 'SFPaymentsExpressButtons.createIntentFunction'
                    })
                    throw new Error()
                }

                let updatedPaymentInstrument
                if (isPayPalPaymentMethodType(paymentMethodType)) {
                    // Remove any leftover Salesforce Payments payment instrument from basket
                    const sfPaymentsInstrument = getSFPaymentsInstrument(expressBasket.current)
                    if (sfPaymentsInstrument) {
                        expressBasket.current = await removePaymentInstrumentFromBasket({
                            parameters: {
                                basketId: expressBasket.current.basketId,
                                paymentInstrumentId: sfPaymentsInstrument.paymentInstrumentId
                            }
                        })
                    }
                    // Add Salesforce Payments payment instrument to basket
                    try {
                        expressBasket.current = await addPaymentInstrumentToBasket({
                            parameters: {basketId: expressBasket.current.basketId},
                            body: createPaymentInstrumentBody({
                                amount:
                                    expressBasket.current.orderTotal ||
                                    expressBasket.current.productSubTotal,
                                paymentMethodType: paymentMethodType,
                                zoneId: zoneId
                            })
                        })
                    } catch (error) {
                        const statusCode = error?.response?.status || error?.status
                        const errorMessage =
                            error?.message || error?.response?.data?.message || 'Unknown error'
                        const errorDetails = error?.response?.data || error?.body || {}

                        logger.error('Failed to add payment instrument to basket', {
                            namespace: 'SFPaymentsExpressButtons.createIntentFunction',
                            additionalProperties: {
                                statusCode,
                                errorMessage,
                                errorDetails,
                                basketId: expressBasket.current?.basketId,
                                paymentMethodType,
                                orderTotal: expressBasket.current?.orderTotal,
                                productSubTotal: expressBasket.current?.productSubTotal,
                                error: error
                            }
                        })
                        showErrorMessage(ERROR_MESSAGE_KEYS.PROCESS_PAYMENT)
                        // Re-throw so SF Payments SDK can handle the error if needed
                        throw error
                    }
                    updatedPaymentInstrument = getSFPaymentsInstrument(expressBasket.current)
                } else {
                    // For Adyen: Update addresses from paymentData before creating order
                    // (Stripe uses onPayerApprove instead, PayPal is handled above)
                    if (isAdyen && paymentData?.shippingDetails) {
                        // Set confirmingBasket to show loading spinner during address updates
                        startConfirming(expressBasket.current)

                        try {
                            const {billingAddress, shippingAddress} = transformAddressDetails(
                                paymentData.billingDetails,
                                paymentData.shippingDetails
                            )
                            // Update shipping address
                            expressBasket.current =
                                await updateShippingAddressForShipment.mutateAsync({
                                    parameters: {
                                        basketId: expressBasket.current.basketId,
                                        shipmentId: DEFAULT_SHIPMENT_ID,
                                        useAsBilling: false
                                    },
                                    body: shippingAddress
                                })

                            // Update billing address
                            await updateBillingAddressForBasket({
                                parameters: {basketId: expressBasket.current.basketId},
                                body: billingAddress
                            })
                        } catch (error) {
                            endConfirming()
                            throw error
                        }
                    }

                    // Create order and update payment instrument
                    try {
                        // For non-PayPal methods, ensure payment instrument exists in basket
                        // (e.g., Stripe adds it in onPayerApprove, but Adyen does not call onPayerApprove before createIntentFunction)
                        // keeping it for all as safety measure
                        expressBasket.current = await ensurePaymentInstrumentInBasket(
                            expressBasket.current,
                            paymentMethodType,
                            zoneId
                        )

                        const order = await createOrderAndUpdatePayment(
                            expressBasket.current.basketId,
                            paymentMethodType,
                            paymentData
                        )
                        orderRef.current = order
                        updatedPaymentInstrument = getSFPaymentsInstrument(order)
                    } catch (error) {
                        // If order was created but updatePaymentInstrumentForOrder failed,
                        // orderNo will be attached to the error
                        if (error.orderNo) {
                            orderRef.current = {orderNo: error.orderNo}
                        }
                        endConfirming()
                        throw error
                    }
                }
                const paymentReference = updatedPaymentInstrument?.paymentReference
                if (isAdyen) {
                    const adyenIntent =
                        paymentReference?.gatewayProperties?.adyen?.adyenPaymentIntent
                    return {
                        pspReference: adyenIntent?.id,
                        guid: paymentReference?.paymentReferenceId,
                        resultCode: adyenIntent?.resultCode,
                        action: adyenIntent?.adyenPaymentIntentAction
                    }
                } else {
                    return {
                        client_secret: getClientSecret(updatedPaymentInstrument),
                        id: paymentReference?.paymentReferenceId
                    }
                }
            }

            const onApproveEvent = async () => {
                try {
                    let order
                    if (isPayPalPaymentMethodType(paymentMethodType)) {
                        // Create order and update payment instrument
                        order = await createOrderAndUpdatePayment(
                            expressBasket.current.basketId,
                            paymentMethodType
                        )
                        orderRef.current = order
                    }

                    // Close modal if callback provided (for mini cart)
                    if (onExpressPaymentCompleted) {
                        onExpressPaymentCompleted()
                    }

                    endConfirming()

                    // Navigate to confirmation page with the order number
                    navigate(`/checkout/confirmation/${orderRef.current?.orderNo}`)
                    isPaymentInProgress.current = false
                } catch (error) {
                    endConfirming()
                }
            }

            /**
             * Handles payment error event.
             * Attempts to fail an order and reopen the basket.
             * Only calls failOrder if the order status supports the transition.
             * @returns {Promise<void>}
             */
            const paymentError = async () => {
                isPaymentInProgress.current = false

                const basketRecovered = await attemptFailOrder(orderRef.current?.orderNo)

                endConfirming()
                if (basketRecovered) {
                    showErrorMessage(ERROR_MESSAGE_KEYS.FAIL_ORDER)
                } else {
                    showErrorMessage(ERROR_MESSAGE_KEYS.ORDER_RECOVERY_FAILED)
                    // Only navigate to cart if NOT on PDP
                    if (usage !== EXPRESS_BUY_NOW) {
                        navigate('/cart')
                    }
                }
            }

            const handlePaymentMethodsRendered = (details) => {
                if (onPaymentMethodsRendered && details.detail.rendered.length > 0) {
                    onPaymentMethodsRendered()
                }
            }

            const paymentMethodSet = {
                paymentMethods: paymentConfig.paymentMethods,
                paymentMethodSetAccounts: paymentConfig.paymentMethodSetAccounts || []
            }
            const config = {
                theme: buildTheme({
                    expressButtonLayout,
                    ...(usage === EXPRESS_BUY_NOW && {
                        expressButtonLabels: {
                            applepay: 'buy',
                            googlepay: 'buy',
                            paypal: 'buynow',
                            venmo: 'buynow'
                        }
                    })
                }),
                actions: {
                    onClick: onClick,
                    onShippingAddressChange: onShippingAddressChange,
                    onShippingMethodChange: onShippingMethodChange,
                    createIntent: createIntentFunction,
                    onPayerApprove: onPayerApprove
                },
                options: {
                    shippingAddressRequired: true,
                    emailAddressRequired: true,
                    billingAddressRequired: true,
                    phoneNumberRequired: true,
                    useManualCapture: !cardCaptureAutomatic,
                    maximumButtonCount
                }
            }

            const paymentRequest = {
                amount: initialAmount,
                currency: paymentCurrency,
                country: 'US', // TODO: see W-18812582
                locale: intl.locale
            }

            containerElementRef.current.innerHTML = '<div></div>'

            const paymentElement = containerElementRef.current.firstChild

            paymentElement.addEventListener('sfp:paymentcancel', onCancel)
            paymentElement.addEventListener('sfp:paymentapprove', onApproveEvent)
            paymentElement.addEventListener('sfp:paymenterror', paymentError)
            paymentElement.addEventListener(
                'sfp:paymentmethodsrendered',
                handlePaymentMethodsRendered
            )

            expressComponent.current = sfp.express(
                metadata,
                paymentMethodSet,
                config,
                paymentRequest,
                paymentElement,
                usage
            )
        }

        // Cleanup on unmount
        return () => {
            if (!isPaymentInProgress.current) {
                expressComponent.current?.destroy()
                expressComponent.current = null
            }
        }
    }, [sfp, metadata, paymentConfig, cardCaptureAutomatic])

    return <Box ref={containerElementRef} data-testid={'sf-payments-express'} />
}

SFPaymentsExpressButtons.propTypes = {
    usage: PropTypes.oneOf([EXPRESS_BUY_NOW, EXPRESS_PAY_NOW]).isRequired,
    paymentCurrency: PropTypes.string.isRequired,
    paymentCountryCode: PropTypes.string,
    initialAmount: PropTypes.number.isRequired,
    prepareBasket: PropTypes.func.isRequired,
    expressButtonLayout: PropTypes.oneOf(['horizontal', 'vertical']),
    maximumButtonCount: PropTypes.number,
    onPaymentMethodsRendered: PropTypes.func,
    onExpressPaymentCompleted: PropTypes.func
}

export default SFPaymentsExpressButtons
