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
import {
    getCurrencyValueForApi,
    getGPShippingOptionParameters
} from '@salesforce/retail-react-app/app/components/express/utils/parsers'
import {AdyenShippingMethodsService} from '@salesforce/retail-react-app/app/components/express/utils/shipping-methods'
import {AdyenShippingAddressService} from '@salesforce/retail-react-app/app/components/express/utils/shipping-address'
import {
    forceOrderCalculation,
    getBasketWithTotals
} from '@salesforce/retail-react-app/app/components/express/utils/pdp/basket-calculation'
import {AdyenPaymentsService} from '@salesforce/retail-react-app/app/components/express/utils/payments'
import {
    createTemporaryBasket,
    deleteTemporaryBasket,
    cleanupTemporaryBasket
} from '@salesforce/retail-react-app/app/components/express/utils/pdp/temporary-basket'
import {useStandalonePaymentMethods} from '@salesforce/retail-react-app/app/components/express/hooks/use-standalone-payment-methods'
import useMultiSite from '@salesforce/retail-react-app/app/hooks/use-multi-site'
import useNavigation from '@salesforce/retail-react-app/app/hooks/use-navigation'
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
    googlePayConfig,
    sku = null,
    setTempBasket = null,
    tempBasket = null,
    isPdpMode = false,
    quantity = 1
) => {
    // For PDP mode, prioritize temporary basket creation over existing basket
    // For regular mode, use existing basket
    const currentBasket = isPdpMode ? tempBasket : basket
    let googlePayAmount = currentBasket?.orderTotal || 0

    // Shared basket reference to prevent multiple basket creation
    // This will be updated by callbacks and shared across all Google Pay events
    // In PDP mode, start with null/tempBasket to force temporary basket creation
    let sharedBasketRef = isPdpMode ? tempBasket : currentBasket

    // Helper function to get or create basket (prevents multiple creation)
    const getOrCreateBasket = async () => {
        // If we already have a shared basket, return it
        if (sharedBasketRef && sharedBasketRef.basketId) {
            return sharedBasketRef
        }

        // For PDP flows, create temporary basket if needed (and SKU is available)
        if (isPdpMode && sku && setTempBasket) {
            try {
                const newBasket = await createTemporaryBasket(sku, authToken, site, quantity)
                sharedBasketRef = newBasket // Update shared reference immediately
                setTempBasket(newBasket) // Update React state for re-renders
                return newBasket
            } catch (error) {
                throw error
            }
        }
        // Return null if no basket can be created/found
        return null
    }

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
            value: getCurrencyValueForApi(googlePayAmount, currentBasket?.currency || 'USD'),
            currency: currentBasket?.currency || 'USD'
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
                        ...getCustomerBillingDetails(
                            data?.paymentMethodData?.info?.billingAddress || data?.shippingAddress
                        )
                    }
                }

                // Get or create basket using shared reference
                let currentBasket = await getOrCreateBasket()
                if (!currentBasket || !currentBasket.basketId) {
                    await cleanupTemporaryBasket(
                        isPdpMode,
                        sharedBasketRef,
                        authToken,
                        site,
                        setTempBasket
                    )
                    sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_FAILURE, {
                        PAYMENT_METHOD
                    })
                    return
                }

                // Basket should already be calculated from payment sheet callbacks
                // (INITIALIZE, SHIPPING_ADDRESS, SHIPPING_OPTION already updated totals)
                googlePayAmount = currentBasket.orderTotal || 0

                // Ensure we have a valid order total before proceeding
                if (
                    currentBasket.orderTotal === null ||
                    currentBasket.orderTotal === undefined
                ) {
                    await cleanupTemporaryBasket(
                        isPdpMode,
                        sharedBasketRef,
                        authToken,
                        site,
                        setTempBasket
                    )
                    sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_FAILURE, {
                        PAYMENT_METHOD
                    })
                    return
                }

                const paymentData = {
                    ...state.data,
                    origin: state.data.origin ? state.data.origin : window.location.origin
                }

                const adyenPaymentService = new AdyenPaymentsService(authToken, site)
                const paymentsResponse = await adyenPaymentService.submitPayment(
                    paymentData,
                    currentBasket?.basketId,
                    currentBasket?.customerInfo?.customerId
                )

                if (paymentsResponse?.isFinal && paymentsResponse?.isSuccessful) {
                    var orderId = paymentsResponse?.merchantReference
                    sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_SUCCESS, {
                        orderId,
                        PAYMENT_METHOD
                    })
                } else {
                    // Clean up temporary basket on payment failure
                    await cleanupTemporaryBasket(
                        isPdpMode,
                        sharedBasketRef,
                        authToken,
                        site,
                        setTempBasket
                    )
                    sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_FAILURE, {
                        PAYMENT_METHOD
                    })
                }
            } catch (err) {
                // Clean up temporary basket on any unexpected error
                await cleanupTemporaryBasket(
                    isPdpMode,
                    sharedBasketRef,
                    authToken,
                    site,
                    setTempBasket
                )
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
                            // Get or create basket using shared reference
                            let basketToUse = await getOrCreateBasket()
                            if (!basketToUse || !basketToUse.basketId) {
                                // Return error if we can't get/create a basket
                                paymentDataRequestUpdate = {
                                    error: {
                                        reason: 'OTHER_ERROR',
                                        message: 'Unable to process order',
                                        intent: 'SHIPPING_ADDRESS'
                                    }
                                }
                                resolve(paymentDataRequestUpdate)
                                return
                            }

                            const updateShippingAddressResponse = await updateShippingAddress(
                                authToken,
                                site,
                                basketToUse,
                                shippingAddress
                            )

                            paymentDataRequestUpdate =
                                updateShippingAddressResponse.paymentDataRequestUpdate
                            // Update our basket reference with the latest data
                            if (updateShippingAddressResponse.newBasket) {
                                sharedBasketRef = updateShippingAddressResponse.newBasket
                                if (isPdpMode && setTempBasket) {
                                    setTempBasket(updateShippingAddressResponse.newBasket)
                                }
                            }
                        }
                        if (callbackTrigger === 'SHIPPING_OPTION') {
                            // Get current basket
                            let basketToUse = await getOrCreateBasket()
                            if (!basketToUse || !basketToUse.basketId) {
                                // Return error if we can't get/create a basket
                                paymentDataRequestUpdate = {
                                    error: {
                                        reason: 'OTHER_ERROR',
                                        message: 'Unable to process order',
                                        intent: 'SHIPPING_OPTION'
                                    }
                                }
                                resolve(paymentDataRequestUpdate)
                                return
                            }

                            const updateShippingOptionResponse = await updateShippingOption(
                                authToken,
                                site,
                                basketToUse,
                                shippingOptionData?.id
                            )

                            paymentDataRequestUpdate =
                                updateShippingOptionResponse.paymentDataRequestUpdate
                            // Update our basket reference with the latest data
                            if (updateShippingOptionResponse.newBasket) {
                                sharedBasketRef = updateShippingOptionResponse.newBasket
                                if (isPdpMode && setTempBasket) {
                                    setTempBasket(updateShippingOptionResponse.newBasket)
                                }
                            }
                        }
                        resolve(paymentDataRequestUpdate)
                    }

                    handlePaymentDataChanged()
                })
            }
        },

        onError: (error) => {
            // Clean up temporary basket when Google Pay is cancelled or fails
            if (error.name === 'CANCEL') {
                cleanupTemporaryBasket(isPdpMode, sharedBasketRef, authToken, site, setTempBasket)
                sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_CANCEL, {
                    PAYMENT_METHOD
                })
            } else {
                cleanupTemporaryBasket(isPdpMode, sharedBasketRef, authToken, site, setTempBasket)
                sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_FAILURE, {
                    PAYMENT_METHOD
                })
            }
        }
    }
    return buttonConfig
}

export const GooglePayExpress = ({
    sku,
    quantity = 1,
    isPdpMode = false,
    basketData,
    authToken: providedAuthToken,
    manager,
    overrideData = null
}) => {
    const {locale, site} = useMultiSite()
    const navigate = useNavigation()

    const [tempBasket, setTempBasket] = useState(null)
    const [currentSku, setCurrentSku] = useState(sku)

    // Check if we have the minimum required basket data (from basket only)
    const hasRequiredBasketData =
        basketData && basketData.orderTotal && basketData.currency && basketData.basketId

    const paymentContainer = useRef(null)

    // In PDP mode, we simply ignore the data since we don't have a provider
    const regularAdyenData = useAdyenExpressCheckout()

    // Use provided auth token for PDP mode, or provider token for regular mode
    const authToken = isPdpMode
        ? providedAuthToken
        : regularAdyenData?.authToken || overrideData?.authToken

    // For PDP mode, use standalone payment methods
    // For regular mode, use the standard Adyen hook data
    const {
        paymentMethods: standalonePaymentMethods,
        loading: standaloneLoading,
        error: standaloneError
    } = useStandalonePaymentMethods(authToken, site, locale, isPdpMode && !!authToken)

    // Handle SKU prop changes (for postMessage updates)
    useEffect(() => {
        if (sku !== currentSku) {
            // Clean up previous temporary basket if switching SKUs
            if (currentSku && tempBasket?.basketId && authToken && site) {
                deleteTemporaryBasket(tempBasket.basketId, authToken, site).catch(() => {})
                setTempBasket(null)
            }
            setCurrentSku(sku)
        }
    }, [sku, currentSku, tempBasket?.basketId, authToken, site])

    const adyenEnvironment = isPdpMode
        ? standalonePaymentMethods?.environment
        : regularAdyenData.adyenEnvironment

    const adyenPaymentMethods = isPdpMode
        ? standalonePaymentMethods
        : regularAdyenData.adyenPaymentMethods

    const finalAuthToken = overrideData?.authToken || authToken
    const finalBasket = overrideData?.basket || basketData

    // Cleanup effect to remove temporary basket when component unmounts
    useEffect(() => {
        return () => {
            // Clean up temporary basket when component unmounts (user navigates away)
            if (isPdpMode && currentSku && tempBasket?.basketId && authToken && site) {
                deleteTemporaryBasket(tempBasket.basketId, authToken, site).catch(() => {})
            }
        }
    }, [tempBasket?.basketId, authToken, site?.id, currentSku, isPdpMode])

    useEffect(() => {
        let isCanceled = false

        const createCheckout = async () => {
            if (isCanceled) {
                return
            }

            const handleGooglePayUnavailable = () => {
                manager.setPaymentMethodUnavailable(PAYMENT_METHOD)
            }

            // For PDP mode, we don't need a basket initially but we do need payment methods
            // For regular mode, we need a basket to continue
            if (isPdpMode) {
                if (!standalonePaymentMethods || standaloneLoading) {
                    return
                }
                if (standaloneError) {
                    handleGooglePayUnavailable()
                    return
                }
            } else {
                // Validate required basket properties
                if (!hasRequiredBasketData) {
                    return
                }
            }

            if (!adyenEnvironment) {
                return
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

                if (!googlePaymentMethodConfig) {
                    handleGooglePayUnavailable()
                    return
                }

                const googleButtonConfig = getGoogleButtonConfig(
                    finalAuthToken,
                    site,
                    finalBasket,
                    googlePaymentMethodConfig,
                    currentSku,
                    setTempBasket,
                    tempBasket,
                    isPdpMode,
                    quantity
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

                // For PDP mode, missing order total is expected initially when no SKU is set
                const isExpectedPdpError = isPdpMode && isMissingOrderTotalError && !tempBasket

                if (
                    !isMissingOrderTotalError &&
                    !isMissingShippingMethodsError &&
                    !isExpectedPdpError
                ) {
                    handleGooglePayUnavailable()
                }
            }
        }
        createCheckout()

        return () => {
            isCanceled = true
        }
    }, [
        adyenEnvironment,
        adyenPaymentMethods,
        isPdpMode,
        quantity,
        ...(isPdpMode
            ? [tempBasket, currentSku, standalonePaymentMethods, standaloneLoading, standaloneError]
            : [])
    ])

    return (
        <>
            <div ref={paymentContainer} style={{height: '40px'}}></div>
        </>
    )
}

GooglePayExpress.propTypes = {
    shippingMethods: PropTypes.array,
    sku: PropTypes.string,
    quantity: PropTypes.number,
    isPdpMode: PropTypes.bool,
    basketData: PropTypes.object,
    authToken: PropTypes.string,
    manager: PropTypes.object,
    overrideData: PropTypes.object
}
