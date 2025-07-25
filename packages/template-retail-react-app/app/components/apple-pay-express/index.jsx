/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef} from 'react'
import AdyenCheckout from '@adyen/adyen-web'
import '@adyen/adyen-web/dist/adyen.css'
import PropTypes from 'prop-types'
import {useAdyenExpressCheckout} from '@adyen/adyen-salesforce-pwa'
import {getCurrencyValueForApi} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/parsers'
import {AdyenShippingMethodsService} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/shipping-methods'
import {AdyenShippingAddressService} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/shipping-address'
import {AdyenPaymentsService} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/payments'

const PAYMENT_METHOD = 'applepay'
const EXPRESS_PAYMENT_AVAILABLE = 'express.payment.available'
const EXPRESS_PAYMENT_UNAVAILABLE = 'express.payment.unavailable'
const EXPRESS_PAYMENT_SUCCESS = 'express.payment.success'
const EXPRESS_PAYMENT_FAILURE = 'express.payment.failure'
const EXPRESS_PAYMENT_CANCEL = 'express.payment.cancel'

const sendExpressMessage = (type, payload = {}) => {
    window.parent.postMessage(
        {
            type,
            payload
        },
        '*'
    )
}

export const getApplePaymentMethodConfig = (paymentMethodsResponse) => {
    const applePayPaymentMethod = paymentMethodsResponse?.paymentMethods?.find(
        (pm) => pm.type === PAYMENT_METHOD
    )
    return applePayPaymentMethod?.configuration || null
}

export const getCustomerShippingDetails = (shippingContact) => {
    return {
        deliveryAddress: {
            city: shippingContact.locality,
            country: shippingContact.countryCode,
            houseNumberOrName:
                shippingContact.addressLines?.length > 1 ? shippingContact.addressLines[1] : '',
            postalCode: shippingContact.postalCode,
            stateOrProvince: shippingContact.administrativeArea,
            street: shippingContact.addressLines?.[0]
        },
        profile: {
            firstName: shippingContact.givenName,
            lastName: shippingContact.familyName,
            email: shippingContact.emailAddress,
            phone: shippingContact.phoneNumber
        }
    }
}

export const getCustomerBillingDetails = (billingContact) => {
    return {
        billingAddress: {
            city: billingContact.locality,
            country: billingContact.countryCode,
            houseNumberOrName:
                billingContact?.addressLines?.length > 1 ? billingContact.addressLines[1] : '',
            postalCode: billingContact.postalCode,
            stateOrProvince: billingContact.administrativeArea,
            street: billingContact.addressLines?.[0]
        }
    }
}

export const getAppleButtonConfig = (
    authToken,
    site,
    basket,
    shippingMethods,
    applePayConfig,
    navigate,
    fetchShippingMethods
) => {
    // Add defensive checks for basket
    if (!basket) {
        console.error('getAppleButtonConfig: basket is null or undefined')
        return null
    }

    console.log('getAppleButtonConfig - basket:', basket)
    console.log('getAppleButtonConfig - basket.orderTotal:', basket.orderTotal)

    // Use basket for all properties with defensive checks
    const orderTotal = basket.orderTotal
    const currency = basket.currency
    const basketId = basket.id

    let applePayAmount = orderTotal
    const buttonConfig = {
        showPayButton: true,
        isExpress: true,
        configuration: applePayConfig,
        amount: {
            value: getCurrencyValueForApi(orderTotal, currency),
            currency: currency
        },
        requiredShippingContactFields: ['postalAddress', 'name', 'email', 'phone'],
        requiredBillingContactFields: ['postalAddress'],
        shippingMethods: Array.isArray(shippingMethods)
            ? shippingMethods.map((sm) => ({
                  label: sm.name,
                  detail: sm.description,
                  identifier: sm.id,
                  amount: `${sm.price}`
              }))
            : [],
        onAuthorized: async (resolve, reject, event) => {
            try {
                const {shippingContact, billingContact, token} = event.payment
                const state = {
                    data: {
                        paymentType: 'express',
                        paymentMethod: {
                            type: 'applepay',
                            applePayToken: token.paymentData
                        },
                        ...getCustomerBillingDetails(billingContact),
                        ...getCustomerShippingDetails(shippingContact)
                    }
                }
                const adyenPaymentService = new AdyenPaymentsService(authToken, site)
                const paymentsResponse = await adyenPaymentService.submitPayment(
                    {
                        ...state.data,
                        origin: state.data.origin ? state.data.origin : window.location.origin
                    },
                    basketId
                )
                if (paymentsResponse?.isFinal && paymentsResponse?.isSuccessful) {
                    const finalPriceUpdate = {
                        newTotal: {
                            type: 'final',
                            label: applePayConfig.merchantName,
                            amount: `${applePayAmount}`
                        }
                    }
                    resolve(finalPriceUpdate)

                    var orderId = paymentsResponse?.merchantReference

                    sendExpressMessage(EXPRESS_PAYMENT_SUCCESS, {
                        orderId,
                        PAYMENT_METHOD
                    })
                } else {
                    reject()
                    sendExpressMessage(EXPRESS_PAYMENT_FAILURE, {
                        PAYMENT_METHOD
                    })
                }
            } catch (err) {
                reject()
                sendExpressMessage(EXPRESS_PAYMENT_FAILURE, {
                    PAYMENT_METHOD
                })
            }
        },
        onSubmit: () => {},
        onShippingContactSelected: async (resolve, reject, event) => {
            try {
                const {shippingContact} = event
                const adyenShippingAddressService = new AdyenShippingAddressService(authToken, site)
                const adyenShippingMethodsService = new AdyenShippingMethodsService(authToken, site)
                const customerShippingDetails = getCustomerShippingDetails(shippingContact)
                await adyenShippingAddressService.updateShippingAddress(
                    basketId,
                    customerShippingDetails
                )
                const newShippingMethods = await fetchShippingMethods(basketId, site, authToken)
                if (!newShippingMethods?.applicableShippingMethods?.length) {
                    reject()
                } else {
                    const response = await adyenShippingMethodsService.updateShippingMethod(
                        newShippingMethods.applicableShippingMethods[0].id,
                        basketId
                    )
                    buttonConfig.amount = {
                        value: getCurrencyValueForApi(response.orderTotal, response.currency),
                        currency: response.currency
                    }
                    applePayAmount = response.orderTotal
                    const finalPriceUpdate = {
                        newShippingMethods: newShippingMethods?.applicableShippingMethods?.map(
                            (sm) => ({
                                label: sm.name,
                                detail: sm.description,
                                identifier: sm.id,
                                amount: `${sm.price}`
                            })
                        ),
                        newTotal: {
                            type: 'final',
                            label: applePayConfig.merchantName,
                            amount: `${applePayAmount}`
                        }
                    }
                    resolve(finalPriceUpdate)
                }
            } catch (err) {
                reject()
            }
        },
        onShippingMethodSelected: async (resolve, reject, event) => {
            try {
                const {shippingMethod} = event
                const adyenShippingMethodsService = new AdyenShippingMethodsService(authToken, site)
                const response = await adyenShippingMethodsService.updateShippingMethod(
                    shippingMethod.identifier,
                    basketId
                )
                if (response.error) {
                    reject()
                } else {
                    buttonConfig.amount = {
                        value: getCurrencyValueForApi(response.orderTotal, response.currency),
                        currency: response.currency
                    }
                    applePayAmount = response.orderTotal
                    const applePayShippingMethodUpdate = {
                        newTotal: {
                            type: 'final',
                            label: applePayConfig.merchantName,
                            amount: `${applePayAmount}`
                        }
                    }
                    resolve(applePayShippingMethodUpdate)
                }
            } catch (err) {
                reject()
            }
        },
        onError: (error) => {
            if (error.name === 'CANCEL') {
                sendExpressMessage(EXPRESS_PAYMENT_CANCEL, {
                    PAYMENT_METHOD
                })
            } else {
                sendExpressMessage(EXPRESS_PAYMENT_FAILURE, {
                    PAYMENT_METHOD
                })
            }
        }
    }
    return buttonConfig
}

export const ApplePayExpress = ({basket}) => {
    console.log('🚀 ApplePayExpress component called with basket:', basket)

    const {
        adyenEnvironment,
        adyenPaymentMethods,
        locale,
        site,
        authToken,
        navigate,
        shippingMethods,
        fetchShippingMethods
    } = useAdyenExpressCheckout()

    // Log basket contents for debugging
    const renderTime = performance.now()
    console.log('=== APPLE PAY EXPRESS COMPONENT RENDERED ===')
    console.log('🔄 Render time:', new Date().toISOString(), 'Performance time:', renderTime)
    console.log('ApplePayExpress - Basket contents:', basket)
    console.log('ApplePayExpress - Basket type:', typeof basket)
    console.log(
        'ApplePayExpress - Basket keys:',
        basket ? Object.keys(basket) : 'basket is null/undefined'
    )
    console.log('ApplePayExpress - basketData:', basket?.basketData)
    console.log('ApplePayExpress - orderTotal:', basket?.basketData?.orderTotal)
    console.log('ApplePayExpress - currency:', basket?.basketData?.currency)
    console.log('ApplePayExpress - id:', basket?.basketData?.id)
    console.log('=== END APPLE PAY EXPRESS LOGGING ===')

    // Check if we have the minimum required basket data (from basket only)
    const hasRequiredBasketData =
        basket &&
        basket.basketData &&
        basket.basketData.orderTotal !== undefined &&
        basket.basketData.currency &&
        basket.basketData.id
    const paymentContainer = useRef(null)

    useEffect(() => {
        let isCanceled = false

        console.log('🔄 ApplePayExpress useEffect triggered with basket:', basket)

        const createCheckout = async () => {
            if (isCanceled) {
                return
            }

            console.log('🔧 createCheckout called with basket:', basket)

            // Validate required basket properties
            if (!hasRequiredBasketData) {
                console.log('❌ Missing required basket data, skipping checkout creation')
                return
            }

            const handleApplePayUnavailable = () => {
                sendExpressMessage(EXPRESS_PAYMENT_UNAVAILABLE, {
                    PAYMENT_METHOD
                })
            }

            try {
                let checkout
                try {
                    checkout = await AdyenCheckout({
                        environment: adyenEnvironment?.ADYEN_ENVIRONMENT,
                        clientKey: adyenEnvironment?.ADYEN_CLIENT_KEY,
                        locale: locale.id,
                        analytics: {
                            analyticsData: {
                                applicationInfo: adyenPaymentMethods?.applicationInfo
                            }
                        }
                    })
                } catch (ex) {
                    handleApplePayUnavailable()
                    return
                }

                const applePaymentMethodConfig = getApplePaymentMethodConfig(adyenPaymentMethods)
                const appleButtonConfig = getAppleButtonConfig(
                    authToken,
                    site,
                    basket.basketData,
                    shippingMethods?.applicableShippingMethods || [],
                    applePaymentMethodConfig,
                    navigate,
                    fetchShippingMethods
                )

                // Check if button config was created successfully
                if (!appleButtonConfig) {
                    console.error('Failed to create Apple Pay button config - missing basket data')
                    handleApplePayUnavailable()
                    return
                }

                let applePayButton
                try {
                    applePayButton = await checkout.create('applepay', appleButtonConfig)
                } catch (ex) {
                    handleApplePayUnavailable()
                    return
                }

                let isApplePayButtonAvailable = false
                try {
                    isApplePayButtonAvailable = await applePayButton.isAvailable()
                } catch (ex) {
                    isApplePayButtonAvailable = false
                }

                if (!isApplePayButtonAvailable) {
                    handleApplePayUnavailable()
                    return
                }

                try {
                    await applePayButton.mount(paymentContainer.current)
                    sendExpressMessage(EXPRESS_PAYMENT_AVAILABLE, {
                        PAYMENT_METHOD
                    })
                } catch (error) {
                    handleApplePayUnavailable()
                }
            } catch (err) {
                console.error('Full error details:', err)
                const isMissingOrderTotalError =
                    err instanceof TypeError &&
                    err.message == "undefined is not an object (evaluating 'a.orderTotal')"
                if (!isMissingOrderTotalError) {
                    handleApplePayUnavailable()
                }
            }
        }

        // Create checkout since basket is guaranteed to be available
        createCheckout()

        return () => {
            isCanceled = true
        }
    }, [adyenEnvironment, adyenPaymentMethods, basket, hasRequiredBasketData])

    return (
        <>
            <div ref={paymentContainer}></div>
        </>
    )
}

ApplePayExpress.propTypes = {
    shippingMethods: PropTypes.array,
    basket: PropTypes.object
}
