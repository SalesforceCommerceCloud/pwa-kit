/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef, useState} from 'react'
import AdyenCheckout from '@adyen/adyen-web'
import '@adyen/adyen-web/dist/adyen.css'
import PropTypes from 'prop-types'
import {useAdyenExpressCheckout} from '@adyen/adyen-salesforce-pwa'
import {getCurrencyValueForApi} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/parsers'
import {AdyenShippingMethodsService} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/shipping-methods'
import {AdyenShippingAddressService} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/shipping-address'
import {AdyenPaymentsService} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/payments'
import {createTemporaryBasket} from '@salesforce/retail-react-app/app/components/apple-pay-express/utils/temporary-basket'

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
    fetchShippingMethods,
    sku = null,
    setTempBasket = null,
    tempBasket = null
) => {
    // Use temporary basket if available, otherwise use main basket
    const currentBasket = tempBasket || basket
    let applePayAmount = currentBasket?.orderTotal || 0
    const buttonConfig = {
        showPayButton: true,
        isExpress: true,
        configuration: applePayConfig,
        amount: {
            value: getCurrencyValueForApi(currentBasket?.orderTotal || 0, currentBasket?.currency || 'USD'),
            currency: currentBasket?.currency || 'USD'
        },
        requiredShippingContactFields: ['postalAddress', 'name', 'email', 'phone'],
        requiredBillingContactFields: ['postalAddress'],
        shippingMethods: shippingMethods?.map((sm) => ({
            label: sm.name,
            detail: sm.description,
            identifier: sm.id,
            amount: `${sm.price}`
        })),
        onClick: async (resolve, reject) => {
            if (sku && setTempBasket) {
                // "Buy Now" flow - create temporary basket
                try {
                    const tempBasketData = await createTemporaryBasket(sku, authToken, site)
                    setTempBasket(tempBasketData)
                    
                    // Update the button config with the temporary basket data
                    buttonConfig.amount = {
                        value: getCurrencyValueForApi(tempBasketData.orderTotal, tempBasketData.currency),
                        currency: tempBasketData.currency
                    }
                    applePayAmount = tempBasketData.orderTotal
                    
                    // Update the Apple Pay sheet with the new pricing
                    const priceUpdate = {
                        newTotal: {
                            type: 'final',
                            label: applePayConfig.merchantName,
                            amount: `${tempBasketData.orderTotal}`
                        }
                    }
                    resolve(priceUpdate)
                } catch (error) {
                    console.error('Error creating temporary basket:', error)
                    reject()
                }
            } else {
                // Regular checkout flow
                resolve()
            }
        },
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
                
                // Use temporary basket if available, otherwise use main basket
                const currentBasket = tempBasket || basket
                
                const adyenPaymentService = new AdyenPaymentsService(authToken, site)
                const paymentsResponse = await adyenPaymentService.submitPayment(
                    {
                        ...state.data,
                        origin: state.data.origin ? state.data.origin : window.location.origin
                    },
                    currentBasket?.basketId,
                    currentBasket?.customerInfo?.customerId
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
                
                // Use temporary basket if available, otherwise use main basket
                const currentBasket = tempBasket || basket
                
                const adyenShippingAddressService = new AdyenShippingAddressService(authToken, site)
                const adyenShippingMethodsService = new AdyenShippingMethodsService(authToken, site)
                const customerShippingDetails = getCustomerShippingDetails(shippingContact)
                await adyenShippingAddressService.updateShippingAddress(
                    currentBasket.basketId,
                    customerShippingDetails
                )
                const newShippingMethods = await fetchShippingMethods(
                    currentBasket?.basketId,
                    site,
                    authToken
                )
                if (!newShippingMethods?.applicableShippingMethods?.length) {
                    reject()
                } else {
                    const response = await adyenShippingMethodsService.updateShippingMethod(
                        newShippingMethods.applicableShippingMethods[0].id,
                        currentBasket.basketId
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
                
                // Use temporary basket if available, otherwise use main basket
                const currentBasket = tempBasket || basket
                
                const adyenShippingMethodsService = new AdyenShippingMethodsService(authToken, site)
                const response = await adyenShippingMethodsService.updateShippingMethod(
                    shippingMethod.identifier,
                    currentBasket.basketId
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

export const ApplePayExpress = ({sku}) => {
    const {
        adyenEnvironment,
        adyenPaymentMethods,
        basket,
        locale,
        site,
        authToken,
        navigate,
        shippingMethods,
        fetchShippingMethods
    } = useAdyenExpressCheckout()
    const paymentContainer = useRef(null)
    const [tempBasket, setTempBasket] = useState(null)

    useEffect(() => {
        let isCanceled = false

        const createCheckout = async () => {
            if (isCanceled) {
                return
            }

            // For "Buy Now" flow, we don't need a basket initially
            // For regular flow, we need a basket to continue
            if (!sku && !basket) {
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
                    basket,
                    shippingMethods?.applicableShippingMethods,
                    applePaymentMethodConfig,
                    navigate,
                    fetchShippingMethods,
                    sku,
                    setTempBasket,
                    tempBasket
                )

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
                
                // For "Buy Now" flow, missing order total is expected initially
                const isExpectedBuyNowError = sku && isMissingOrderTotalError && !tempBasket
                
                if (!isMissingOrderTotalError && !isExpectedBuyNowError) {
                    handleApplePayUnavailable()
                }
            }
        }

        createCheckout()

        return () => {
            isCanceled = true
        }
    }, [adyenEnvironment, adyenPaymentMethods, tempBasket, basket, shippingMethods])

    return (
        <>
            <div ref={paymentContainer}></div>
        </>
    )
}

ApplePayExpress.propTypes = {
    shippingMethods: PropTypes.array,
    sku: PropTypes.string
}
