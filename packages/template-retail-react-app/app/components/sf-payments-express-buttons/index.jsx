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
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useShopperOrdersMutation} from '@salesforce/commerce-sdk-react'
import {useShippingMethodsForShipment} from '@salesforce/commerce-sdk-react'
import {usePaymentConfiguration} from '@salesforce/commerce-sdk-react'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useSFPaymentsCountry} from '@salesforce/retail-react-app/app/hooks/use-sf-payments-country'
import {useShopperConfiguration} from '@salesforce/retail-react-app/app/hooks/use-shopper-configuration'
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
    isPayPalPaymentMethodType
} from '@salesforce/retail-react-app/app/utils/sf-payments-utils'

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
    const {countryCode: fallbackCountryCode} = useSFPaymentsCountry()
    const {sfp, metadata, startConfirming, endConfirming} = useSFPayments()

    const {data: paymentConfig} = usePaymentConfiguration({
        parameters: {
            currency: paymentCurrency,
            countryCode: paymentCountryCode || fallbackCountryCode || 'US' // TODO: remove US when parameter made optional
        }
    })

    const cardCaptureAutomatic = useAutomaticCapture()
    const zoneId = useShopperConfiguration('zoneId')

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

    const expressBasket = useRef(null)
    const prepareBasketPromise = useRef(null)
    const containerElementRef = useRef(null)
    const expressComponent = useRef(null)
    const prepareBasketRef = useRef(prepareBasket)

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

    const showErrorMessage = (message) => {
        toast({
            title:
                message ||
                intl.formatMessage({
                    defaultMessage:
                        'Your attempted payment was unsuccessful. You have not been charged and your order has not been placed. Please select a different payment method and submit payment again to complete your checkout and place your order.',
                    id: 'sfp_payments_express.error.default'
                }),
            status: 'error'
        })
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
     * Create order from basket and update payment instrument
     * TODO: Once Fail Order SCAPI is available, call it to clean up orders when
     * payment instrument update fails
     */
    const createOrderAndUpdatePayment = async (basketId, paymentType, zoneIdValue) => {
        // Create order from the basket
        let order = await createOrder({
            body: {basketId}
        })
        // Store orderNo immediately - basket is consumed at this point
        const createdOrderNo = order.orderNo

        // Find SF Payments payment instrument in created order
        const orderPaymentInstrument = getSFPaymentsInstrument(order)

        try {
            const paymentInstrumentBody = createPaymentInstrumentBody(
                order.orderTotal,
                paymentType,
                zoneIdValue
            )

            // Update order payment instrument to create payment
            order = await updatePaymentInstrumentForOrder({
                parameters: {
                    orderNo: order.orderNo,
                    paymentInstrumentId: orderPaymentInstrument.paymentInstrumentId
                },
                body: paymentInstrumentBody
            })
        } catch (error) {
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
        if (metadata && sfp && paymentConfig && containerElementRef.current) {
            if (expressComponent.current) {
                expressComponent.current.destroy()
                expressComponent.current = null
            }

            let paymentMethodType = null
            let orderNo = null

            const mapPaymentMethodType = (type) => {
                switch (type) {
                    case 'applepay':
                    case 'googlepay':
                        return 'card'
                    default:
                        return type
                }
            }

            const onClick = async (type) => {
                paymentMethodType = mapPaymentMethodType(type)

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
                                showErrorMessage(
                                    e.message ||
                                        intl.formatMessage({
                                            defaultMessage:
                                                'Unable to prepare basket for express payments. Please select all required product attributes.',
                                            id: 'sfp_payments_express.error.prepare_basket'
                                        })
                                )
                            }
                        })
                }
                return {
                    amount: initialAmount.toString(),
                    shippingRates: []
                }
            }

            const onCancel = async () => {
                endConfirming()

                // If an order was already created, the basket was consumed - don't try to clean it up
                if (orderNo) {
                    expressBasket.current = null
                    showErrorMessage()
                    return
                }

                // Only clean up if no order was created (basket still exists)
                const sfPaymentsInstrument = getSFPaymentsInstrument(expressBasket.current)
                if (sfPaymentsInstrument) {
                    expressBasket.current = await removePaymentInstrumentFromBasket({
                        parameters: {
                            basketId: expressBasket.current.basketId,
                            paymentInstrumentId: sfPaymentsInstrument.paymentInstrumentId
                        }
                    })
                }
                // Delete the temporary basket if it exists
                if (expressBasket.current?.basketId && expressBasket.current?.temporaryBasket) {
                    await deleteBasket({
                        parameters: {basketId: expressBasket.current.basketId}
                    })
                }
                // Clear the ref after cleanup
                expressBasket.current = null
                showErrorMessage(
                    intl.formatMessage({
                        defaultMessage:
                            'Your attempted payment was unsuccessful. You have not been charged and your order has not been placed. Please select a different payment method and submit payment again to complete your checkout and place your order.',
                        id: 'sfp_payments_express.error.cancel'
                    })
                )
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
                if (!isPayPalPaymentMethodType(paymentMethodType) && orderNo) {
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
                        expressBasket.current = await addPaymentInstrumentToBasket({
                            parameters: {basketId: updatedBasket.basketId},
                            body: createPaymentInstrumentBody(
                                updatedBasket.orderTotal || updatedBasket.productSubTotal, // Use updatedBasket instead of expressBasket.current
                                paymentMethodType,
                                zoneId
                            )
                        })
                    }
                } catch (error) {
                    endConfirming()
                    throw error
                }
            }

            const createIntentFunction = async () => {
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
                    expressBasket.current = await addPaymentInstrumentToBasket({
                        parameters: {basketId: expressBasket.current.basketId},
                        body: createPaymentInstrumentBody(
                            expressBasket.current.orderTotal ||
                                expressBasket.current.productSubTotal,
                            paymentMethodType,
                            zoneId
                        )
                    })
                    updatedPaymentInstrument = getSFPaymentsInstrument(expressBasket.current)
                } else {
                    // Create order and update payment instrument
                    try {
                        const order = await createOrderAndUpdatePayment(
                            expressBasket.current.basketId,
                            paymentMethodType,
                            zoneId
                        )
                        orderNo = order.orderNo
                        updatedPaymentInstrument = getSFPaymentsInstrument(order)
                    } catch (error) {
                        // If order was created but updatePaymentInstrumentForOrder failed,
                        // orderNo will be attached to the error
                        if (error.orderNo) {
                            orderNo = error.orderNo
                        }
                        throw error
                    }
                }
                return {
                    client_secret:
                        updatedPaymentInstrument.paymentReference.gatewayProperties?.stripe
                            ?.clientSecret,
                    id: updatedPaymentInstrument.paymentReference.paymentReferenceId
                }
            }

            const onApproveEvent = async () => {
                try {
                    let order
                    if (isPayPalPaymentMethodType(paymentMethodType)) {
                        // Create order and update payment instrument
                        order = await createOrderAndUpdatePayment(
                            expressBasket.current.basketId,
                            paymentMethodType,
                            zoneId
                        )
                        orderNo = order.orderNo
                    }

                    // Close modal if callback provided (for mini cart)
                    if (onExpressPaymentCompleted) {
                        onExpressPaymentCompleted()
                    }

                    endConfirming()

                    // Navigate to confirmation page with the order number
                    navigate(`/checkout/confirmation/${orderNo}`)
                } catch (error) {
                    endConfirming()
                }
            }

            const paymentError = async () => {
                endConfirming()
                if (orderNo) {
                    // TODO: fail the order
                    orderNo = null
                }
            }

            const handlePaymentMethodsRendered = (details) => {
                if (onPaymentMethodsRendered && details.detail.rendered.length > 0) {
                    onPaymentMethodsRendered()
                }
            }

            const paymentMethodSet = {
                paymentMethods: paymentConfig.paymentMethods,
                paymentMethodSetAccounts: paymentConfig.paymentMethodSetAccounts
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
            expressComponent.current?.destroy()
            expressComponent.current = null
        }
    }, [sfp, metadata, paymentConfig, cardCaptureAutomatic, containerElementRef.current])

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
