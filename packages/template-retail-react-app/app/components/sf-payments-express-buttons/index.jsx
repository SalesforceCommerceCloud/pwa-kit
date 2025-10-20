/*
 * Copyright (c) 2025, salesforce.com, inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import React, {useEffect, useRef} from 'react'
import PropTypes from 'prop-types'
import {useIntl} from 'react-intl'
import {useQueryClient} from '@tanstack/react-query'

import {Box} from '@salesforce/retail-react-app/app/components/shared/ui'

import {DEFAULT_SHIPMENT_ID} from '@salesforce/retail-react-app/app/constants'
import {useShopperBasketsMutation} from '@salesforce/commerce-sdk-react'
import {useShopperOrdersMutation} from '@salesforce/commerce-sdk-react'
import {useShippingMethodsForShipment} from '@salesforce/commerce-sdk-react'
import {usePaymentConfiguration} from '@salesforce/commerce-sdk-react'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
import {useSFPaymentsCountry} from '@salesforce/retail-react-app/app/hooks/use-sf-payments-country'
import {
    EXPRESS_BUY_NOW,
    EXPRESS_PAY_NOW,
    useSFPayments
} from '@salesforce/retail-react-app/app/hooks/use-sf-payments'
import {useToast} from '@salesforce/retail-react-app/app/hooks/use-toast'
import {buildTheme} from '@salesforce/retail-react-app/app/utils/sf-payments-utils'

const SFPaymentsExpressButtons = ({
    usage,
    paymentCurrency,
    paymentCountryCode,
    initialAmount,
    prepareBasket,
    expressButtonLayout = 'vertical',
    maximumButtonCount = undefined,
    onPaymentMethodsRendered
}) => {
    const intl = useIntl()
    const navigate = useNavigation()
    const toast = useToast()
    const queryClient = useQueryClient()
    const {countryCode: fallbackCountryCode} = useSFPaymentsCountry()
    const {sfp, metadata, startConfirming, endConfirming} = useSFPayments()

    const {data: paymentConfig} = usePaymentConfiguration({
        parameters: {
            currency: paymentCurrency,
            countryCode: paymentCountryCode || fallbackCountryCode || 'US' // TODO: remove US when parameter made optional
        }
    })

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

    const createExpressCallback = (currentBasket, currentShippingMethods) => {
        // Get currently selected shipping method
        const selectedShippingMethodId =
            currentBasket.shipments?.[0]?.shippingMethod?.id ||
            currentShippingMethods.defaultShippingMethodId

        // Get representation of applicable shipping methods with the current one sorted at the top
        const expressShippingMethods = currentShippingMethods.applicableShippingMethods
            .map((method) => {
                return {
                    id: method.id,
                    name: method.name,
                    classOfService: method.description,
                    shippingFee: method.price.toString(),
                    currencyIsoCode: currentBasket.currency
                }
            })
            .sort((m1, m2) => {
                if (m1.id === selectedShippingMethodId) {
                    return -1
                } else if (m2.id === selectedShippingMethodId) {
                    return 1
                }
                return 0
            })

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

            const callPrepareBasket = () => {
                setTimeout(async () => {
                    try {
                        expressBasket.current = await prepareBasket()
                    } catch (e) {
                        console.error('Error preparing basket', e)
                    }
                })
            }

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
                callPrepareBasket()
                return {
                    amount: initialAmount.toString(),
                    shippingRates: []
                }
            }

            const onClickEvent = (evt) => {
                paymentMethodType = mapPaymentMethodType(evt.detail.selectedPaymentMethod)
                callPrepareBasket()
            }

            const onCancel = () => {
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

                    // Get currently selected shipping method
                    const currentShippingMethodId = updatedBasket.shipments[0].shippingMethod?.id
                    if (
                        !updatedShippingMethods.applicableShippingMethods.find(
                            (method) => method.id === currentShippingMethodId
                        )
                    ) {
                        // If the current shipping method isn't set or is inapplicable, set it to the first applicable one
                        updatedBasket = await updateShippingMethod.mutateAsync({
                            parameters: {
                                basketId: expressBasket.current.basketId,
                                shipmentId: DEFAULT_SHIPMENT_ID
                            },
                            body: {
                                id: updatedShippingMethods.applicableShippingMethods[0].id
                            }
                        })
                    }

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

                        // First update billing address in basket
                        const billingAddress = {
                            firstName: null,
                            lastName: null,
                            address1: evt.detail.billingDetails.address.line1,
                            address2: evt.detail.billingDetails.address.line2 || null,
                            city: evt.detail.billingDetails.address.city,
                            stateCode: evt.detail.billingDetails.address.state,
                            postalCode: evt.detail.billingDetails.address.postalCode,
                            countryCode: evt.detail.billingDetails.address.country,
                            phone: evt.detail.billingDetails.phone || null
                        }
                        if (evt.detail.billingDetails.name) {
                            const billingNames = evt.detail.billingDetails.name.split(' ')
                            billingAddress.firstName = billingNames.slice(0, -1).join(' ')
                            billingAddress.lastName = billingNames.slice(-1).join(' ')
                        }

                        await updateBillingAddressForBasket({
                            parameters: {basketId: expressBasket.current.basketId},
                            body: billingAddress
                        })

                        // Next update shipping address in basket
                        const shippingAddress = {
                            firstName: null,
                            lastName: null,
                            address1: evt.detail.shippingDetails.address.line1,
                            address2: evt.detail.shippingDetails.address.line2 || null,
                            city: evt.detail.shippingDetails.address.city,
                            stateCode: evt.detail.shippingDetails.address.state,
                            postalCode: evt.detail.shippingDetails.address.postalCode,
                            countryCode: evt.detail.shippingDetails.address.country,
                            phone: null
                        }
                        if (evt.detail.shippingDetails.name) {
                            const shippingNames = evt.detail.shippingDetails.name.split(' ')
                            shippingAddress.firstName = shippingNames.slice(0, -1).join(' ')
                            shippingAddress.lastName = shippingNames.slice(-1).join(' ')
                        }

                        const updatedBasket = await updateShippingAddressForShipment.mutateAsync({
                            parameters: {
                                basketId: expressBasket.current.basketId,
                                shipmentId: DEFAULT_SHIPMENT_ID,
                                useAsBilling: false
                            },
                            body: shippingAddress
                        })

                        // Create SF Payments basket payment instrument before creating order
                        const basketPaymentInstrument = {
                            bankRoutingNumber: paymentMethodType, // see W-19626908
                            paymentMethodId: 'Salesforce Payments',
                            amount: updatedBasket.orderTotal
                        }

                        await addPaymentInstrumentToBasket({
                            parameters: {basketId: updatedBasket.basketId},
                            body: basketPaymentInstrument
                        })
                    })()
                )
            }

            const createIntentFunction = async () => {
                // Create order from the basket
                const order = await createOrder({
                    body: {basketId: expressBasket.current.basketId}
                })
                orderNo = order.orderNo

                // Find SF Payments payment instrument in created order
                let orderPaymentInstrument = order.paymentInstruments.find(
                    (pi) => pi.paymentMethodId === 'Salesforce Payments'
                )

                // Update order payment instrument to create payment
                const updatedOrder = await updatePaymentInstrumentForOrder({
                    parameters: {
                        orderNo: order.orderNo,
                        paymentInstrumentId: orderPaymentInstrument.paymentInstrumentId
                    },
                    body: {
                        bankRoutingNumber: paymentMethodType, // remove after W-19626908
                        paymentMethodId: 'Salesforce Payments',
                        amount: order.orderTotal
                    }
                })

                // Find updated SF Payments payment instrument in updated order
                orderPaymentInstrument = updatedOrder.paymentInstruments.find(
                    (pi) => pi.paymentInstrumentId === orderPaymentInstrument.paymentInstrumentId
                )

                // Track created payment intent
                return {
                    client_secret: orderPaymentInstrument.paymentReference.clientSecret,
                    id: orderPaymentInstrument.paymentReference.paymentReferenceId
                }
            }

            const onApproveEvent = async () => {
                // Remove tracked basket being confirmed
                endConfirming()

                // Ensure updated order state shown on confirmation page
                // TODO: only invalidate order queries
                queryClient.invalidateQueries()

                // Navigate to confirmation page
                navigate(`/checkout/confirmation/${orderNo}`)
                endConfirming()
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
                    createIntentFunction: createIntentFunction
                },
                options: {
                    shippingAddressRequired: true,
                    emailAddressRequired: true,
                    billingAddressRequired: true,
                    phoneNumberRequired: true,
                    useManualCapture: !paymentConfig.card_capture_automatic,
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
    }, [sfp, metadata, paymentConfig, containerElementRef.current])

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
    onPaymentMethodsRendered: PropTypes.func
}

export default SFPaymentsExpressButtons
