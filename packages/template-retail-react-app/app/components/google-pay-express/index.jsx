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
import {getCurrencyValueForApi, getGPShippingOptionParameters} from '@salesforce/retail-react-app/app/components/express/utils/parsers'
import {AdyenShippingMethodsService} from '@salesforce/retail-react-app/app/components/express/utils/shipping-methods'
import {AdyenShippingAddressService} from '@salesforce/retail-react-app/app/components/express/utils/shipping-address'
import {AdyenPaymentsService} from '@salesforce/retail-react-app/app/components/express/utils/payments'

const PAYMENT_METHOD = 'googlepay'
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

export const getGooglePaymentMethodConfig = (paymentMethodsResponse) => {
    const googlePayPaymentMethod = paymentMethodsResponse?.paymentMethods?.find(
        (pm) => pm.type === PAYMENT_METHOD
    )
    return googlePayPaymentMethod?.configuration || null
}

export const getCustomerShippingDetails = (shippingAddress) => {
    return {
        deliveryAddress: {
            city: shippingAddress.locality,
            country: shippingAddress.countryCode,
            houseNumberOrName: shippingAddress.address2,
            postalCode: shippingAddress.postalCode,
            stateOrProvince: shippingAddress.administrativeArea,
            street: shippingAddress.address1
        },
        profile: {
            firstName: shippingAddress.name?.split(' ')[0] || '',
            lastName: shippingAddress.name?.split(' ').slice(1).join(' ') || '',
        }
    }
}

// 'inputAddress' is the billing address if available, else we fall back to the shipping address
export const getCustomerBillingDetails = (inputAddress) => {
    return {
        billingAddress: {
            city: inputAddress.locality,
            country: inputAddress.countryCode,
            houseNumberOrName: inputAddress.address2,
            postalCode: inputAddress.postalCode,
            stateOrProvince: inputAddress.administrativeArea,
            street: inputAddress.address1
        }
    }
}

export const updateShippingAddress = async (
    authToken,
    site,
    basket,
    shippingAddress
) => {
    try {
        const adyenShippingAddressService = new AdyenShippingAddressService(authToken, site)
        const response = await adyenShippingAddressService.updateShippingAddress(
            basket.basketId,
            getCustomerShippingDetails(shippingAddress)
        )
        if (response.error) {
            return {
                error: {
                    reason: 'SHIPPING_ADDRESS_UNAVAILABLE',
                    message: 'Cannot ship to the selected address',
                    intent: 'SHIPPING_ADDRESS'
                }
            }
        }

        const adyenShippingMethodsService = new AdyenShippingMethodsService(authToken, site)
        const shippingMethodResponse = await adyenShippingMethodsService.getShippingMethods(basket.basketId)
        let shippingOptionId = shippingMethodResponse.defaultShippingMethodId

        // If the default shipping method is not applicable, update to the first applicable shipping method
        if (!shippingMethodResponse.applicableShippingMethods.some((sm) => sm.id === shippingOptionId)) {
            shippingOptionId = shippingMethodResponse.applicableShippingMethods[0].id
            shippingMethodResponse.defaultShippingMethodId = shippingOptionId
        }
        return updateShippingOption(authToken, site, basket, shippingOptionId, shippingMethodResponse)
    } catch (error) {
        return {
            error: {
                reason: 'SHIPPING_ADDRESS_UNAVAILABLE',
                message: 'Cannot ship to the selected address',
                intent: 'SHIPPING_ADDRESS'
            }
        }
    }
}

export const updateShippingOption = async (
    authToken,
    site,
    basket,
    shippingOptionId,
    shippingMethodResponse = null
) => {
    try {
        const adyenShippingMethodsService = new AdyenShippingMethodsService(authToken, site)    
        const response = await adyenShippingMethodsService.updateShippingMethod(
            shippingOptionId,
            basket.basketId
        )
        if (response.error) {
            return {
                error: {
                    reason: 'SHIPPING_OPTION_UNAVAILABLE',
                    message: 'Cannot ship to the selected address',
                    intent: 'SHIPPING_OPTION'
                }
            }
        } 

        const paymentDataRequestUpdate = {
            newTransactionInfo: {
                countryCode: response.currency,
                currencyCode: response.currency,
                totalPriceStatus: 'FINAL',
                totalPriceLabel: 'Total',
                totalPrice: `${response.orderTotal}`
            }
        }
        // If we were called by updateShippingAddress, we need to update the shippingOptionParameters as well
        if (shippingMethodResponse) {
            paymentDataRequestUpdate.newShippingOptionParameters = {
                ...getGPShippingOptionParameters(shippingMethodResponse)
            }
        }
        return paymentDataRequestUpdate
    } catch (error) {
        return {
            error: {
                reason: 'SHIPPING_OPTION_UNAVAILABLE',
                message: 'Error updating shipping option',
                intent: 'SHIPPING_OPTION'
            }
        }
    }
}

export const getGoogleButtonConfig = (
    authToken,
    site,
    basket,
    shippingMethods,
    googlePayConfig,
    navigate,
    fetchShippingMethods
) => {    
    // Use productTotal if orderTotal is null, otherwise use orderTotal (INITIALIZE callback will update this in payment sheet eventually anyways)
    let googlePayAmount = basket.orderTotal || (basket.productTotal)
    
    const buttonConfig = {
        showPayButton: true,
        buttonType: 'buy', 
        isExpress: true,
        shippingAddressRequired: true,
        // shippingAddressParameters: {"allowedCountryCodes": ["US"]}, // If you want to restrict country codes, you can do that here
        shippingOptionRequired: true,
        shippingOptionParameters: getGPShippingOptionParameters(shippingMethods), 
        billingAddressRequired: true,
        billingAddressParameters: {"format": "FULL"},
        emailRequired: true,
        configuration: googlePayConfig,
        amount: {
            value: getCurrencyValueForApi(googlePayAmount, basket.currency),
            currency: basket.currency
        },
        requiredShippingContactFields: ['postalAddress', 'name', 'email', 'phone'],
        requiredBillingContactFields: ['postalAddress'],
        
        onAuthorized: async (data) => {
            try {
                const state = {
                    data: {
                        paymentType: 'express',
                        paymentMethod: {
                            type: 'googlepay',
                            googlePayToken: data.paymentMethodData.tokenizationData.token
                        },
                        ...getCustomerShippingDetails(data?.shippingAddress),
                        ...getCustomerBillingDetails(data?.paymentMethodData?.info?.billingAddress || data?.shippingAddress)
                    }
                }
                const adyenPaymentService = new AdyenPaymentsService(authToken, site)
                const paymentsResponse = await adyenPaymentService.submitPayment(
                    {
                        ...state.data,
                    },
                    basket?.basketId,
                    basket?.customerInfo?.customerId
                )

                if (paymentsResponse?.isFinal && paymentsResponse?.isSuccessful) {
                    var orderId = paymentsResponse?.merchantReference
                    sendExpressMessage(EXPRESS_PAYMENT_SUCCESS, {
                        orderId,
                        PAYMENT_METHOD
                    })
                } else {
                    sendExpressMessage(EXPRESS_PAYMENT_FAILURE, {
                        PAYMENT_METHOD
                    })
                }
            } catch (err) {
                sendExpressMessage(EXPRESS_PAYMENT_FAILURE, {
                    PAYMENT_METHOD
                })
            }
        },
        onSubmit: () => {},
        callbackIntents: ['SHIPPING_ADDRESS', 'SHIPPING_OPTION'],
        paymentDataCallbacks: {
             onPaymentDataChanged: (intermediatePaymentData) => {
                return new Promise(async (resolve) => {
                    const { callbackTrigger, shippingAddress, shippingOptionData } = intermediatePaymentData;
                    let paymentDataRequestUpdate = {};
                        
                    if (callbackTrigger === 'INITIALIZE' || callbackTrigger === 'SHIPPING_ADDRESS') {
                        paymentDataRequestUpdate = await updateShippingAddress(authToken, site, basket, shippingAddress)
                    }
                    if (callbackTrigger === 'SHIPPING_OPTION') {
                        paymentDataRequestUpdate = await updateShippingOption(authToken, site, basket, shippingOptionData?.id)
                    }
                    
                    resolve(paymentDataRequestUpdate);
                });
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

export const GooglePayExpress = () => {
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

    useEffect(() => {
        let isCanceled = false

        const createCheckout = async () => {
            if (isCanceled) {
                return
            }

            const handleGooglePayUnavailable = () => {
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
                    handleGooglePayUnavailable()
                    return
                }

                const googlePaymentMethodConfig = getGooglePaymentMethodConfig(adyenPaymentMethods)
                const googleButtonConfig = getGoogleButtonConfig(
                    authToken,
                    site,
                    basket,
                    !shippingMethods && basket?.basketId ? await fetchShippingMethods(basket?.basketId, site, authToken) : shippingMethods,
                    googlePaymentMethodConfig,
                    navigate,
                    fetchShippingMethods
                )

                let googlePayButton
                try {
                    googlePayButton = await checkout.create('googlepay', googleButtonConfig)
                } catch (ex) {
                    handleGooglePayUnavailable()
                    return
                }

                let isGooglePayButtonAvailable = false
                try {
                    isGooglePayButtonAvailable = await googlePayButton.isAvailable()
                } catch (ex) {
                    isGooglePayButtonAvailable = false
                }

                if (!isGooglePayButtonAvailable) {
                    handleGooglePayUnavailable()
                    return
                }

                try {
                    await googlePayButton.mount(paymentContainer.current)
                    sendExpressMessage(EXPRESS_PAYMENT_AVAILABLE, {
                        PAYMENT_METHOD
                    })
                } catch (error) {
                    handleGooglePayUnavailable()
                }
            } catch (err) {
                const isMissingOrderTotalError =
                    err instanceof TypeError &&
                    (/undefined is not an object \(evaluating '[a-z]\.orderTotal'\)/.test(err.message) || // Safari error
                    /Cannot read properties of undefined \(reading 'orderTotal'\)/.test(err.message)) // Chrome error

                const isMissingShippingMethodsError =
                    err instanceof TypeError &&
                    (/undefined is not an object \(evaluating '[a-z]\.defaultShippingMethodId'\)/.test(err.message)|| 
                    /Cannot read properties of undefined \(reading 'defaultShippingMethodId'\)/.test(err.message))

                if (!isMissingOrderTotalError && !isMissingShippingMethodsError) {
                    handleGooglePayUnavailable()
                }
            }
        }
        createCheckout()

        return () => {
            isCanceled = true
        }
    }, [adyenEnvironment, adyenPaymentMethods])

    return (
        <>
            <div ref={paymentContainer}></div>
        </>
    )
}

GooglePayExpress.propTypes = {
    shippingMethods: PropTypes.array
}
