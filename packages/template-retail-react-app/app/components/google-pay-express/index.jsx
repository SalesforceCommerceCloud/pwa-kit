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
import {
    getCurrencyValueForApi,
    getGPShippingOptionParameters
} from '@salesforce/retail-react-app/app/components/express/utils/parsers'
import {AdyenShippingMethodsService} from '@salesforce/retail-react-app/app/components/express/utils/shipping-methods'
import {AdyenShippingAddressService} from '@salesforce/retail-react-app/app/components/express/utils/shipping-address'
import {AdyenPaymentsService} from '@salesforce/retail-react-app/app/components/express/utils/payments'
import {
    PAYMENT_METHODS,
    EXPRESS_MESSAGES
} from '@salesforce/retail-react-app/app/components/express/utils/constants'

const PAYMENT_METHOD = PAYMENT_METHODS.GOOGLE_PAY

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
            lastName: shippingAddress.name?.split(' ').slice(1).join(' ') || ''
        }
    }
}

// 'inputAddress' is the billing address if available, else we will fall back to the shipping address
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

export const updateShippingAddress = async (authToken, site, basket, shippingAddress) => {
    try {
        const adyenShippingAddressService = new AdyenShippingAddressService(authToken, site)
        const response = await adyenShippingAddressService.updateShippingAddress(
            basket.basketId,
            getCustomerShippingDetails(shippingAddress)
        )
        console.log('😱😱😱 updateShippingAddress response', response)
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
        const shippingMethodResponse = await adyenShippingMethodsService.getShippingMethods(
            basket.basketId
        )
        let shippingOptionId = shippingMethodResponse.defaultShippingMethodId
        console.log('😱😱😱 shippingMethodResponse: ', shippingMethodResponse)

        // If the default shipping method is not applicable for this address, update to the first applicable
        if (
            !shippingMethodResponse.applicableShippingMethods.some(
                (sm) => sm.id === shippingOptionId
            )
        ) {
            shippingOptionId = shippingMethodResponse.applicableShippingMethods[0].id
            shippingMethodResponse.defaultShippingMethodId = shippingOptionId
        }
        return updateShippingOption(
            authToken,
            site,
            basket,
            shippingOptionId,
            shippingMethodResponse
        )
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
        console.log('😱😱😱 updateShippingOption response', response)
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
        // If we were called by updateShippingAddress we will have shippingMethodResponse
        // We need to update the shippingOptionParameters for applicable shipping methods to the new address
        if (shippingMethodResponse) {
            paymentDataRequestUpdate.newShippingOptionParameters = {
                ...getGPShippingOptionParameters(shippingMethodResponse)
            }
        }
        return {
            paymentDataRequestUpdate: paymentDataRequestUpdate,
            newBasket: response
        }
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
    googlePayConfig
) => {
    // Use productTotal if orderTotal is null, otherwise use orderTotal
    // The INITIALIZE callback will update this in payment sheet before user can try to pay
    let googlePayAmount = basket.orderTotal || basket.productTotal

    const buttonConfig = {
        showPayButton: true,
        buttonType: 'plain',
        isExpress: true,
        shippingAddressRequired: true,
        // shippingAddressParameters: {"allowedCountryCodes": ["US"]}, // If you want to restrict country codes, you can do that here
        shippingOptionRequired: true,
        billingAddressRequired: true,
        billingAddressParameters: {format: 'FULL'},
        emailRequired: true,
        configuration: googlePayConfig,
        amount: {
            value: getCurrencyValueForApi(googlePayAmount, basket.currency),
            currency: basket.currency
        },
        requiredShippingContactFields: ['postalAddress', 'name', 'email', 'phone'],
        requiredBillingContactFields: ['postalAddress'],

        onAuthorized: async (data) => {
            console.log('⌛⌛⌛ onAuthorized', data)
            try {
                const state = {
                    data: {
                        paymentType: 'express',
                        paymentMethod: {
                            type: 'googlepay',
                            googlePayToken: data.paymentMethodData.tokenizationData.token
                        },
                        ...getCustomerShippingDetails(data?.shippingAddress),
                        ...getCustomerBillingDetails(
                            data?.paymentMethodData?.info?.billingAddress || data?.shippingAddress
                        )
                    }
                }
                console.log('📝📝📝 state', state)
                console.log('🧺🧺🧺 basket before submitPayment', basket)

                const adyenPaymentService = new AdyenPaymentsService(authToken, site)
                const paymentsResponse = await adyenPaymentService.submitPayment(
                    {
                        ...state.data
                    },
                    basket?.basketId,
                    basket?.customerInfo?.customerId
                )

                if (paymentsResponse?.isFinal && paymentsResponse?.isSuccessful) {
                    var orderId = paymentsResponse?.merchantReference
                    sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_SUCCESS, {
                        orderId,
                        PAYMENT_METHOD
                    })
                } else {
                    sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_FAILURE, {
                        PAYMENT_METHOD
                    })
                }
            } catch (err) {
                sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_FAILURE, {
                    PAYMENT_METHOD
                })
            }
        },
        onSubmit: () => {},
        callbackIntents: ['SHIPPING_ADDRESS', 'SHIPPING_OPTION'],
        paymentDataCallbacks: {
            onPaymentDataChanged: (intermediatePaymentData) => {
                return new Promise((resolve) => {
                    const {callbackTrigger, shippingAddress, shippingOptionData} =
                        intermediatePaymentData
                    let paymentDataRequestUpdate = {}

                    const handlePaymentDataChanged = async () => {
                        if (
                            callbackTrigger === 'INITIALIZE' ||
                            callbackTrigger === 'SHIPPING_ADDRESS'
                        ) {
                            console.log('🔄🔄🔄 updateShippingAddress', shippingAddress)
                            const updateShippingAddressResponse = await updateShippingAddress(
                                authToken,
                                site,
                                basket,
                                shippingAddress
                            )
                            console.log('📝📝📝 updateShippingAddressResponse', updateShippingAddressResponse)
                            paymentDataRequestUpdate = updateShippingAddressResponse.paymentDataRequestUpdate
                            // Update our basket with the latest data
                            basket = updateShippingAddressResponse.newBasket
                            console.log('🧺‼️‼️ basket after updateShippingAddress', basket)
                        }
                        if (callbackTrigger === 'SHIPPING_OPTION') {
                            console.log('🔄🔄🔄 updateShippingOption', shippingOptionData)
                            const updateShippingOptionResponse = await updateShippingOption(
                                authToken,
                                site,
                                basket,
                                shippingOptionData?.id
                            )
                            console.log('📝📝📝 updateShippingOptionResponse', updateShippingOptionResponse)
                            paymentDataRequestUpdate = updateShippingOptionResponse.paymentDataRequestUpdate
                            // Update our basket with the latest data
                            basket = updateShippingOptionResponse.newBasket
                            console.log('🧺‼️‼️ basket after updateShippingOption', basket)
                        }
                        console.log('🧗🧗🧗 paymentDataRequestUpdate', paymentDataRequestUpdate)
                        resolve(paymentDataRequestUpdate)
                    }

                    handlePaymentDataChanged()
                })
            }
        },

        onError: (error) => {
            if (error.name === 'CANCEL') {
                sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_CANCEL, {
                    PAYMENT_METHOD
                })
            } else {
                sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_FAILURE, {
                    PAYMENT_METHOD
                })
            }
        }
    }
    return buttonConfig
}

export const GooglePayExpress = ({manager}) => {
    const {
        adyenEnvironment,
        adyenPaymentMethods,
        basket,
        locale,
        site,
        authToken
    } = useAdyenExpressCheckout()

    console.log('🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥')
    console.log('🔣🔣🔣 adyenEnvironment', adyenEnvironment)
    console.log('🔣🔣🔣 adyenPaymentMethods', adyenPaymentMethods)
    console.log('🔣🔣🔣 basket', basket)
    console.log('🔣🔣🔣 locale', locale)
    console.log('🔣🔣🔣 site', site)
    console.log('🔣🔣🔣 authToken', authToken)
    console.log('🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥🫥')

    const paymentContainer = useRef(null)

    useEffect(() => {
        let isCanceled = false

        const createCheckout = async () => {
            if (isCanceled) {
                return
            }

            const handleGooglePayUnavailable = () => {
                manager.setPaymentMethodUnavailable(PAYMENT_METHOD)
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
                    googlePaymentMethodConfig
                )
                console.log('🔲🔲🔲 googleButtonConfig', googleButtonConfig)

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
                    manager.setPaymentMethodAvailable(PAYMENT_METHOD)
                } catch (error) {
                    handleGooglePayUnavailable()
                }
            } catch (err) {
                const isMissingOrderTotalError =
                    err instanceof TypeError &&
                    (/undefined is not an object \(evaluating '[a-z]\.orderTotal'\)/.test(
                        err.message
                    ) || // Safari error
                        /Cannot read properties of undefined \(reading 'orderTotal'\)/.test(
                            err.message
                        )) // Chrome error

                const isMissingShippingMethodsError =
                    err instanceof TypeError &&
                    (/undefined is not an object \(evaluating '[a-z]\.defaultShippingMethodId'\)/.test(
                        err.message
                    ) ||
                        /Cannot read properties of undefined \(reading 'defaultShippingMethodId'\)/.test(
                            err.message
                        ))

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
    manager: PropTypes.object
}
