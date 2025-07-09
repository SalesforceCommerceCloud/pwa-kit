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

/**
 * Cache for AdyenCheckout instances to avoid recreating them on every component mount.
 * Key: environment-clientKey-locale
 */
const checkoutCache = new Map()

/**
 * Cache for Apple Pay availability checks with 5-minute TTL to reduce API calls.
 * Key: availability-environment-clientKey-locale
 */
const availabilityCache = new Map()
const AVAILABILITY_CACHE_TTL = 5 * 60 * 1000 // 5 minutes

const sendExpressMessage = (type, payload = {}) => {
    window.parent.postMessage(
        {
            type,
            payload
        },
        '*'
    )
}

const getCheckoutCacheKey = (environment, clientKey, locale) => {
    return `${environment}-${clientKey}-${locale}`
}

const getAvailabilityCacheKey = (environment, clientKey, locale) => {
    return `availability-${environment}-${clientKey}-${locale}`
}

/**
 * Creates or retrieves a cached AdyenCheckout instance.
 * @param {string} environment - Adyen environment (test/live)
 * @param {string} clientKey - Adyen client key
 * @param {string} locale - Locale identifier
 * @param {Object} applicationInfo - Application info for analytics
 * @returns {Promise<Object>} AdyenCheckout instance
 */
const createCachedCheckout = async (environment, clientKey, locale, applicationInfo) => {
    const cacheKey = getCheckoutCacheKey(environment, clientKey, locale)

    if (checkoutCache.has(cacheKey)) {
        return checkoutCache.get(cacheKey)
    }

    const checkout = await AdyenCheckout({
        environment,
        clientKey,
        locale,
        analytics: {
            analyticsData: {
                applicationInfo
            }
        }
    })

    checkoutCache.set(cacheKey, checkout)
    return checkout
}

/**
 * Checks Apple Pay availability with caching to reduce API calls.
 * @param {Object} applePayButton - Apple Pay button instance
 * @returns {Promise<boolean>} Whether Apple Pay is available
 */
const checkCachedAvailability = async (applePayButton) => {
    const cacheKey = getAvailabilityCacheKey(
        applePayButton.checkout.environment,
        applePayButton.checkout.clientKey,
        applePayButton.checkout.locale
    )

    const cached = availabilityCache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < AVAILABILITY_CACHE_TTL) {
        return cached.available
    }

    try {
        const available = await applePayButton.isAvailable()
        availabilityCache.set(cacheKey, {
            available,
            timestamp: Date.now()
        })
        return available
    } catch (ex) {
        availabilityCache.set(cacheKey, {
            available: false,
            timestamp: Date.now()
        })
        return false
    }
}

export const clearAllCaches = () => {
    checkoutCache.clear()
    availabilityCache.clear()
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
    // Use default values if basket/orderTotal/currency are missing
    const orderTotal = basket && typeof basket.orderTotal !== 'undefined' ? basket.orderTotal : 0
    const currency = basket && basket.currency ? basket.currency : 'USD'
    let applePayAmount = orderTotal
    const buttonConfig = {
        showPayButton: true,
        isExpress: true,
        configuration: applePayConfig || {},
        amount: {value: applePayAmount, currency},
        requiredShippingContactFields: ['postalAddress', 'name', 'email', 'phone'],
        requiredBillingContactFields: ['postalAddress'],
        shippingMethods: shippingMethods?.map((sm) => ({
            label: sm.name,
            detail: sm.description,
            identifier: sm.id,
            amount: `${sm.price}`
        })),
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
                    basket?.basketId,
                    basket?.customerInfo?.customerId
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
                    basket.basketId,
                    customerShippingDetails
                )
                const newShippingMethods = await fetchShippingMethods(
                    basket?.basketId,
                    site,
                    authToken
                )
                if (!newShippingMethods?.applicableShippingMethods?.length) {
                    reject()
                } else {
                    const response = await adyenShippingMethodsService.updateShippingMethod(
                        newShippingMethods.applicableShippingMethods[0].id,
                        basket.basketId
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
                    basket.basketId
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

export const ApplePayExpress = () => {
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
        let retryCount = 0
        const maxRetries = 5
        const retryDelay = 200 // 200ms

        const createCheckout = async () => {
            if (isCanceled) {
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
                    checkout = await createCachedCheckout(
                        adyenEnvironment.ADYEN_ENVIRONMENT,
                        adyenEnvironment.ADYEN_CLIENT_KEY,
                        locale.id,
                        adyenPaymentMethods.applicationInfo
                    )
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
                    fetchShippingMethods
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
                    isApplePayButtonAvailable = await checkCachedAvailability(applePayButton)
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

        const tryCreateCheckout = () => {
            if (isCanceled) return

            // Validation for all required data except orderTotal
            if (
                !adyenEnvironment?.ADYEN_ENVIRONMENT ||
                !adyenEnvironment?.ADYEN_CLIENT_KEY ||
                !locale?.id ||
                !basket ||
                !basket.currency ||
                adyenPaymentMethods?.applicationInfo === undefined
            ) {
                sendExpressMessage(EXPRESS_PAYMENT_UNAVAILABLE, {
                    PAYMENT_METHOD
                })
                return
            }

            // If orderTotal is undefined, retry up to maxRetries
            if (typeof basket.orderTotal === 'undefined') {
                if (retryCount < maxRetries) {
                    retryCount++
                    setTimeout(tryCreateCheckout, retryDelay)
                } else {
                    sendExpressMessage(EXPRESS_PAYMENT_UNAVAILABLE, {
                        PAYMENT_METHOD
                    })
                }
                return
            }

            createCheckout()
        }

        tryCreateCheckout()

        return () => {
            isCanceled = true
            availabilityCache.clear()
        }
    }, [adyenEnvironment, adyenPaymentMethods, basket?.basketId, site])

    return (
        <>
            <div ref={paymentContainer}></div>
        </>
    )
}

ApplePayExpress.propTypes = {
    shippingMethods: PropTypes.array
}
