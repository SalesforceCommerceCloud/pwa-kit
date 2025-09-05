/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef} from 'react'
import '@adyen/adyen-web/dist/adyen.css'
import PropTypes from 'prop-types'

import {
    getCurrencyValueForApi,
    getGPShippingOptionParameters
} from '@salesforce/retail-react-app/app/components/express/utils/parsers'
import {AdyenShippingMethodsService} from '@salesforce/retail-react-app/app/components/express/utils/shipping-methods'
import {AdyenShippingAddressService} from '@salesforce/retail-react-app/app/components/express/utils/shipping-address'
import {AdyenPaymentsService} from '@salesforce/retail-react-app/app/components/express/utils/payments'
import {
    createTemporaryBasket,
    deleteTemporaryBasket,
    cleanupTemporaryBasket
} from '@salesforce/retail-react-app/app/components/express/utils/pdp/temporary-basket'
import {useExpressPaymentSetup} from '@salesforce/retail-react-app/app/components/express/hooks/use-express-payment-setup'
import {usePaymentPerformance} from '@salesforce/retail-react-app/app/components/express/hooks/use-payment-performance'
import {
    validateExpressPaymentSetup,
    getExpressPaymentDependencies,
    sendExpressMessage,
    getPaymentMethodConfig,
    isMissingOrderTotalError,
    isMissingShippingMethodsError,
    createAdyenCheckout
} from '@salesforce/retail-react-app/app/components/express/utils/express-payment-utils'
import {
    PAYMENT_METHODS,
    EXPRESS_MESSAGES
} from '@salesforce/retail-react-app/app/components/express/utils/constants'

const PAYMENT_METHOD = PAYMENT_METHODS.GOOGLE_PAY

export const getGooglePaymentMethodConfig = (paymentMethodsResponse) => {
    return getPaymentMethodConfig(paymentMethodsResponse, PAYMENT_METHOD)
}

export const getCustomerShippingDetails = (shippingAddress, email) => {
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
            email: email || '',
            phone: shippingAddress.phoneNumber || ''
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

export const updateShippingAddress = async (authToken, refreshToken, site, basket, shippingAddress, updateTokens = null) => {
    try {
        const adyenShippingAddressService = new AdyenShippingAddressService(authToken, refreshToken, site, updateTokens)
        const response = await adyenShippingAddressService.updateShippingAddress(
            basket.basketId,
            getCustomerShippingDetails(shippingAddress, basket?.customerInfo?.email)
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

        const adyenShippingMethodsService = new AdyenShippingMethodsService(authToken, refreshToken, site, updateTokens)
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
            refreshToken,
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
    refreshToken,
    site,
    basket,
    shippingOptionId,
    shippingMethodResponse = null,
    updateTokens = null
) => {
    try {
        const adyenShippingMethodsService = new AdyenShippingMethodsService(authToken, refreshToken, site, updateTokens)
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
    refreshToken,
    updateTokens,
    site,
    basket,
    googlePayConfig,
    sku = null,
    setTempBasket = null,
    tempBasket = null,
    isPdpMode = false,
    quantity = 1
) => {
    // Single basket reference that gets updated as needed
    // Initialize basketRef with the actual basket value, not null
    let basketRef = isPdpMode ? tempBasket : basket
    let googlePayAmount = basketRef?.orderTotal || 0

    // Helper function to get or create basket (prevents multiple creation)
    const getOrCreateBasket = async () => {
        // If we already have a basket reference, return it
        if (basketRef && basketRef.basketId) {
            return basketRef
        }

        // For PDP flows, create temporary basket if needed (and SKU is available)
        if (isPdpMode && sku && typeof sku === 'string' && setTempBasket) {
            try {
                const newBasket = await createTemporaryBasket(sku, authToken, refreshToken, site, quantity, updateTokens)
                basketRef = newBasket // Update basket reference immediately
                setTempBasket(newBasket) // Update React state for re-renders
                return newBasket
            } catch (error) {
                console.error('❌ Failed to create temporary basket:', error)
                return null
            }
        }

        // For Cart mode, use the existing basket
        if (basket && basket.basketId) {
            basketRef = basket // Update basket reference
            return basket
        }

        return null
    }

    const buttonConfig = {
        showPayButton: true,
        buttonType: 'plain',
        isExpress: true,
        shippingAddressRequired: true,
        shippingAddressParameters: {phoneNumberRequired: true},
        shippingOptionRequired: true,
        billingAddressRequired: true,
        billingAddressParameters: {format: 'FULL'},
        emailRequired: true,
        configuration: googlePayConfig,
        amount: {
            value: getCurrencyValueForApi(googlePayAmount, basketRef?.currency || 'USD'),
            currency: basketRef?.currency || 'USD'
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
                        ...getCustomerShippingDetails(data?.shippingAddress, data?.email),
                        ...getCustomerBillingDetails(
                            data?.paymentMethodData?.info?.billingAddress || data?.shippingAddress
                        )
                    }
                }

                // Get or create basket using basket reference
                let basketToUse = await getOrCreateBasket()
                if (!basketToUse || !basketToUse.basketId) {
                    await cleanupTemporaryBasket(
                        isPdpMode,
                        basketRef,
                        authToken,
                        refreshToken,
                        site,
                        setTempBasket,
                        updateTokens
                    )
                    sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_FAILURE, {
                        PAYMENT_METHOD
                    })
                    return
                }

                // Basket should already be calculated from payment sheet callbacks
                // (INITIALIZE, SHIPPING_ADDRESS, SHIPPING_OPTION already updated totals)
                googlePayAmount = basketToUse.orderTotal || 0

                // Ensure we have a valid order total before proceeding
                if (basketToUse.orderTotal === null || basketToUse.orderTotal === undefined) {
                    await cleanupTemporaryBasket(
                        isPdpMode,
                        basketRef,
                        authToken,
                        refreshToken,
                        site,
                        setTempBasket,
                        updateTokens
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

                const adyenPaymentService = new AdyenPaymentsService(authToken, refreshToken, site, updateTokens)
                const paymentsResponse = await adyenPaymentService.submitPayment(
                    paymentData,
                    basketToUse?.basketId,
                    basketToUse?.customerInfo?.customerId
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
                        basketRef,
                        authToken,
                        refreshToken,
                        site,
                        setTempBasket,
                        updateTokens
                    )
                    sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_FAILURE, {
                        PAYMENT_METHOD
                    })
                }
            } catch (err) {
                // Clean up temporary basket on any unexpected error
                await cleanupTemporaryBasket(isPdpMode, basketRef, authToken, site, setTempBasket)
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
                            // Get or create basket using basket reference
                            let basketToUse = await getOrCreateBasket()

                            if (!basketToUse || !basketToUse.basketId) {
                                console.error('❌ SHIPPING_ADDRESS: No basket available')
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
                                refreshToken,
                                site,
                                basketToUse,
                                shippingAddress,
                                updateTokens
                            )

                            paymentDataRequestUpdate =
                                updateShippingAddressResponse.paymentDataRequestUpdate
                            // Update our basket reference with the latest data
                            if (updateShippingAddressResponse.newBasket) {
                                basketRef = updateShippingAddressResponse.newBasket
                                if (isPdpMode && setTempBasket) {
                                    setTempBasket(updateShippingAddressResponse.newBasket)
                                }
                            }
                        }
                        if (callbackTrigger === 'SHIPPING_OPTION') {
                            // Get current basket
                            let basketToUse = await getOrCreateBasket()

                            if (!basketToUse || !basketToUse.basketId) {
                                console.error('❌ SHIPPING_OPTION: No basket available')
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
                                refreshToken,
                                site,
                                basketToUse,
                                shippingOptionData?.id,
                                null,
                                updateTokens
                            )

                            paymentDataRequestUpdate =
                                updateShippingOptionResponse.paymentDataRequestUpdate
                            // Update our basket reference with the latest data
                            if (updateShippingOptionResponse.newBasket) {
                                basketRef = updateShippingOptionResponse.newBasket
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
                cleanupTemporaryBasket(isPdpMode, basketRef, authToken, refreshToken, site, setTempBasket, updateTokens)
                sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_CANCEL, {
                    PAYMENT_METHOD
                })
            } else {
                cleanupTemporaryBasket(isPdpMode, basketRef, authToken, refreshToken, site, setTempBasket, updateTokens)
                sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_FAILURE, {
                    PAYMENT_METHOD
                })
            }
        }
    }
    return buttonConfig
}

export const GooglePayExpress = ({
    // All props now come from expressPaymentContext
    adyenPaymentMethods,
    authToken,
    refreshToken,
    updateTokens,
    locale: providedLocale,
    site: providedSite,
    basket,
    sku,
    quantity = 1,
    isPdpMode = false,
    manager
}) => {
    const paymentContainer = useRef(null)
    
    // Initialize performance monitoring
    const performance = usePaymentPerformance('googlepay')

    // Use the shared express payment setup hook
    const {
        locale: finalLocale,
        site: finalSite,
        tempBasket,
        setTempBasket,
        currentSku,
        hasRequiredBasketData
    } = useExpressPaymentSetup({
        sku,
        quantity,
        isPdpMode,
        basket,
        authToken,
        locale: providedLocale,
        site: providedSite
    })

    // Cleanup effect to remove temporary basket when component unmounts
    useEffect(() => {
        return () => {
            // Clean up temporary basket when component unmounts (user navigates away)
            if (isPdpMode && currentSku && tempBasket?.basketId && authToken && finalSite) {
                deleteTemporaryBasket(tempBasket.basketId, authToken, refreshToken, finalSite, updateTokens).catch(() => {})
            }
        }
    }, [tempBasket?.basketId, authToken, refreshToken, finalSite?.id, currentSku, isPdpMode])

    useEffect(
        () => {
            let isCanceled = false

            const createCheckout = async () => {
                if (isCanceled) {
                    return
                }
                
                // Log initialization attempt
                console.log(`🚀 Google Pay: Starting initialization (PDP mode: ${isPdpMode}, Basket: ${basket?.basketId ? 'available' : 'missing'})`)
                
                // Mark initialization start
                performance.markInitializationStart()

                const handleGooglePayUnavailable = () => {
                    manager.setPaymentMethodUnavailable(PAYMENT_METHOD)
                }

                // For PDP mode, we don't need a basket initially but we do need payment methods
                // For regular mode, we need a basket to continue
                if (
                    !validateExpressPaymentSetup({
                        isPdpMode,
                        adyenPaymentMethods: adyenPaymentMethods,
                        hasRequiredBasketData
                    })
                ) {
                    return
                }

                if (!adyenPaymentMethods?.environment) {
                    return
                }

                try {
                    // Mark checkout creation start
                    performance.markCheckoutCreationStart()
                    
                    let checkout
                    try {
                        checkout = await createAdyenCheckout(
                            adyenPaymentMethods?.environment,
                            finalLocale,
                            adyenPaymentMethods?.applicationInfo
                        )
                    } catch (ex) {
                        performance.markError(ex, 'checkout-creation')
                        handleGooglePayUnavailable()
                        return
                    }

                    const googlePaymentMethodConfig =
                        getGooglePaymentMethodConfig(adyenPaymentMethods)

                    if (!googlePaymentMethodConfig) {
                        performance.markError(new Error('Google Pay configuration not found'), 'configuration-check')
                        handleGooglePayUnavailable()
                        return
                    }

                    const googleButtonConfig = getGoogleButtonConfig(
                        authToken,
                        refreshToken,
                        updateTokens,
                        finalSite,
                        basket,
                        googlePaymentMethodConfig,
                        currentSku,
                        setTempBasket,
                        tempBasket,
                        isPdpMode,
                        quantity
                    )

                    // Mark button creation start
                    performance.markButtonCreationStart()
                    
                    let googlePayButton
                    try {
                        googlePayButton = await checkout.create('googlepay', googleButtonConfig)
                    } catch (ex) {
                        performance.markError(ex, 'button-creation')
                        handleGooglePayUnavailable()
                        return
                    }

                    // Mark availability check start
                    performance.markAvailabilityCheckStart()
                    
                    let isGooglePayButtonAvailable = false
                    try {
                        isGooglePayButtonAvailable = await googlePayButton.isAvailable()
                    } catch (ex) {
                        isGooglePayButtonAvailable = false
                    }

                    if (!isGooglePayButtonAvailable) {
                        performance.markError(new Error('Google Pay not available'), 'availability-check')
                        handleGooglePayUnavailable()
                        return
                    }

                    // Mark mounting start
                    performance.markMountingStart()
                    
                    try {
                        await googlePayButton.mount(paymentContainer.current)
                        manager.setPaymentMethodAvailable(PAYMENT_METHOD)
                        
                        // Mark payment ready
                        performance.markPaymentReady()
                    } catch (error) {
                        performance.markError(error, 'mounting')
                        handleGooglePayUnavailable()
                    }
                } catch (err) {
                    const isExpectedPdpError =
                        isPdpMode && isMissingOrderTotalError(err) && !tempBasket

                    if (
                        !isMissingOrderTotalError(err) &&
                        !isMissingShippingMethodsError(err) &&
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
        },
        getExpressPaymentDependencies({
            adyenPaymentMethods,
            basket,
            sku,
            quantity,
            isPdpMode,
            tempBasket,
            currentSku
        })
    )

    return <div ref={paymentContainer}></div>
}

GooglePayExpress.propTypes = {
    // All props now come from sharedPaymentData
    adyenPaymentMethods: PropTypes.object,
    authToken: PropTypes.string,
    refreshToken: PropTypes.string,
    updateTokens: PropTypes.func,
    locale: PropTypes.object,
    site: PropTypes.object,
    basket: PropTypes.object,
    sku: PropTypes.string,
    quantity: PropTypes.number,
    isPdpMode: PropTypes.bool,
    manager: PropTypes.object
}
