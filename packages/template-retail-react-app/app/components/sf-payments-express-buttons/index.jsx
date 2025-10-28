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

    const expressBasket = useRef(null)
    const containerElementRef = useRef(null)
    const expressComponent = useRef(null)

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
     */
    const createOrderAndUpdatePayment = async (basketId, paymentType, zoneIdValue) => {
        // Create order from the basket
        let order = await createOrder({
            body: {basketId}
        })

        // Find SF Payments payment instrument in created order
        const orderPaymentInstrument = getSFPaymentsInstrument(order)

        // Update order payment instrument to create payment
        order = await updatePaymentInstrumentForOrder({
            parameters: {
                orderNo: order.orderNo,
                paymentInstrumentId: orderPaymentInstrument.paymentInstrumentId
            },
            body: createPaymentInstrumentBody(order.orderTotal, paymentType, zoneIdValue)
        })

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
        const total = currentBasket.orderTotal || currentBasket.productSubTotal
        const lineItems = [
            {
                name: intl.formatMessage({
                    defaultMessage: 'Subtotal',
                    id: 'order_summary.label.subtotal'
                }),
                amount: currentBasket.productSubTotal.toString()
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
            grandTotalAmount: total.toString(),
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
                    case 'apple_pay':
                    case 'google_pay':
                        return 'card'
                    default:
                        return type
                }
            }

            const onClick = async (type) => {
                paymentMethodType = mapPaymentMethodType(type)

                // For non-PayPal payment methods, prepare basket immediately
                if (!isPayPalPaymentMethodType(paymentMethodType)) {
                    try {
                        expressBasket.current = await prepareBasket()
                    } catch (e) {
                        console.error('Error preparing basket', e)
                    }
                }

                return {
                    amount: initialAmount.toString(),
                    shippingRates: []
                }
            }

            const onClickEvent = (evt) => {
                paymentMethodType = mapPaymentMethodType(evt.detail.selectedPaymentMethod)

                // For non-PayPal payment methods, prepare basket immediately
                if (!isPayPalPaymentMethodType(paymentMethodType)) {
                    prepareBasket()
                        .then((basket) => {
                            expressBasket.current = basket
                        })
                        .catch((e) => {
                            console.error('Error preparing basket', e)
                        })
                }
            }

            const onCancel = async () => {
                const sfPaymentsInstrument = getSFPaymentsInstrument(expressBasket.current)
                if (sfPaymentsInstrument) {
                    expressBasket.current = await removePaymentInstrumentFromBasket({
                        parameters: {
                            basketId: expressBasket.current.basketId,
                            paymentInstrumentId: sfPaymentsInstrument.paymentInstrumentId
                        }
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
                    console.error(e)
                    showErrorMessage()
                    callback.updateShippingAddress({
                        errors: ['fail']
                    })
                }
            }

            const onShippingMethodChange = async (shippingMethod, callback) => {
                try {
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

                    // Fetch applicable shipping methods after shipping method update
                    const {data: updatedShippingMethods} = await refetchShippingMethods()

                    const expressCallback = createExpressCallback(
                        updatedBasket,
                        updatedShippingMethods
                    )
                    callback.updateShippingRate(expressCallback)
                } catch (e) {
                    console.error(e)
                    showErrorMessage()
                    callback.updateShippingRate({
                        errors: ['fail']
                    })
                }
            }

            const onBeforeApprove = (evt) => {
                evt.detail.addValidation(
                    (async () => {
                        startConfirming(expressBasket.current)

                        // Transform both billing and shipping addresses
                        const {billingAddress, shippingAddress} = transformAddressDetails(
                            evt.detail.billingDetails,
                            evt.detail.shippingDetails
                        )

                        // Update billing address in basket
                        await updateBillingAddressForBasket({
                            parameters: {basketId: expressBasket.current.basketId},
                            body: billingAddress
                        })

                        // Next update shipping address in basket

                        const updatedBasket = await updateShippingAddressForShipment.mutateAsync({
                            parameters: {
                                basketId: expressBasket.current.basketId,
                                shipmentId: DEFAULT_SHIPMENT_ID,
                                useAsBilling: false
                            },
                            body: shippingAddress
                        })

                        // For Stripe, create SF Payments basket payment instrument before creating order
                        if (!isPayPalPaymentMethodType(paymentMethodType)) {
                            await addPaymentInstrumentToBasket({
                                parameters: {basketId: updatedBasket.basketId},
                                body: createPaymentInstrumentBody(
                                    updatedBasket.orderTotal,
                                    paymentMethodType,
                                    zoneId
                                )
                            })
                        }
                    })()
                )
            }

            const createIntentFunction = async () => {
                try {
                    // For PayPal/Venmo, prepare basket here since createIntentFunction is called after button click
                    if (isPayPalPaymentMethodType(paymentMethodType)) {
                        if (!expressBasket.current) {
                            try {
                                expressBasket.current = await prepareBasket()
                            } catch (e) {
                                console.error('Error preparing basket', e)
                                throw new Error('Failed to prepare basket')
                            }
                        }
                    }

                    if (!expressBasket.current) {
                        console.error('Express basket not prepared')
                        throw new Error('Basket not ready')
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
                        const order = await createOrderAndUpdatePayment(
                            expressBasket.current.basketId,
                            paymentMethodType,
                            zoneId
                        )
                        orderNo = order.orderNo
                        updatedPaymentInstrument = getSFPaymentsInstrument(order)
                    }

                    return {
                        client_secret: updatedPaymentInstrument.paymentReference.clientSecret,
                        id: updatedPaymentInstrument.paymentReference.paymentReferenceId
                    }
                } catch (error) {
                    console.error('Error in createIntentFunction:', error)
                    throw error
                }
            }

            const onPayPalShippingChange = async (data, callbacks) => {
                // Check if shipping_address or selected_shipping_option exists on data
                if (!data?.shipping_address && !data?.selected_shipping_option) {
                    if (callbacks?.updateShipping) {
                        await callbacks.updateShipping({
                            errors: ['No shipping address or shipping option provided']
                        })
                    }
                    return
                }

                try {
                    let updatedBasket = expressBasket.current
                    let updatedShippingMethods

                    // Handle shipping address update
                    if (data.shipping_address) {
                        // Update the shipping address in the default shipment
                        updatedBasket = await updateShippingAddressForShipment.mutateAsync({
                            parameters: {
                                basketId: expressBasket.current.basketId,
                                shipmentId: DEFAULT_SHIPMENT_ID,
                                useAsBilling: false
                            },
                            body: {
                                firstName: null,
                                lastName: null,
                                address1: data.shipping_address.line1 || null,
                                address2: data.shipping_address.line2 || null,
                                city: data.shipping_address.city,
                                stateCode: data.shipping_address.state,
                                postalCode: data.shipping_address.postal_code,
                                countryCode: data.shipping_address.country,
                                phone: null
                            }
                        })

                        // Fetch applicable shipping methods after address update
                        const shippingMethodsResponse = await refetchShippingMethods()
                        updatedShippingMethods = shippingMethodsResponse.data

                        // Validate and update shipping method if needed
                        updatedBasket = await validateAndUpdateShippingMethod(
                            expressBasket.current.basketId,
                            updatedBasket,
                            updatedShippingMethods
                        )
                    }

                    // Handle shipping method update
                    if (data.selected_shipping_option) {
                        // Update the shipping method in the default shipment
                        updatedBasket = await updateShippingMethod.mutateAsync({
                            parameters: {
                                basketId: expressBasket.current.basketId,
                                shipmentId: DEFAULT_SHIPMENT_ID
                            },
                            body: {
                                id: data.selected_shipping_option.id
                            }
                        })

                        // Fetch applicable shipping methods if not already fetched
                        if (!updatedShippingMethods) {
                            const shippingMethodsResponse = await refetchShippingMethods()
                            updatedShippingMethods = shippingMethodsResponse.data
                        }
                    }

                    // Update expressBasket reference
                    expressBasket.current = updatedBasket

                    // Get currently selected shipping method ID after potential update
                    const selectedShippingMethodId = getSelectedShippingMethodId(
                        updatedBasket,
                        updatedShippingMethods
                    )

                    // Get representation of applicable shipping methods
                    const shippingMethods = transformShippingMethods(
                        updatedShippingMethods.applicableShippingMethods,
                        updatedBasket,
                        selectedShippingMethodId,
                        false
                    )

                    // Get representation of currently selected shipping method
                    const selectedShippingMethod =
                        shippingMethods.find((method) => method.id === selectedShippingMethodId) ||
                        shippingMethods[0]

                    // Execute callback with updated basket information
                    if (callbacks?.updateShipping) {
                        await callbacks.updateShipping({
                            grandTotalAmount: updatedBasket.orderTotal,
                            shippingMethods: shippingMethods,
                            selectedShippingMethod: selectedShippingMethod
                        })
                    }
                } catch (error) {
                    if (callbacks?.updateShipping) {
                        await callbacks.updateShipping({
                            errors: ['Failed to update shipping']
                        })
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
                    console.error('Error in onApproveEvent:', error)
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
                    expressButtonClickFunction: onClick,
                    onShippingAddressChangeFunction: onShippingAddressChange,
                    onShippingOptionChangeFunction: onShippingMethodChange,
                    createIntentFunction: createIntentFunction,
                    updateIntentFunction: onPayPalShippingChange
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
            paymentElement.addEventListener('sfppaymentbuttonclick', onClickEvent)
            paymentElement.addEventListener('sfppaymentbuttoncancel', onCancel)
            paymentElement.addEventListener('sfppaymentcancelled', onCancel)
            paymentElement.addEventListener('sfppaymentbuttonbeforeapprove', onBeforeApprove)
            paymentElement.addEventListener('sfppaymentbuttonapprove', onApproveEvent)
            paymentElement.addEventListener('sfppaymentbuttonerror', paymentError)
            paymentElement.addEventListener(
                'sfppaymentmethodsrendered',
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
