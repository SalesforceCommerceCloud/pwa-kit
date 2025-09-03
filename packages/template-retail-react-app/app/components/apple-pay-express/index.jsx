/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef} from 'react'
import '@adyen/adyen-web/dist/adyen.css'
import PropTypes from 'prop-types'

import {getCurrencyValueForApi} from '@salesforce/retail-react-app/app/components/express/utils/parsers'
import {AdyenShippingMethodsService} from '@salesforce/retail-react-app/app/components/express/utils/shipping-methods'
import {AdyenShippingAddressService} from '@salesforce/retail-react-app/app/components/express/utils/shipping-address'
import {AdyenPaymentsService} from '@salesforce/retail-react-app/app/components/express/utils/payments'
import {
    createTemporaryBasket,
    deleteTemporaryBasket,
    cleanupTemporaryBasket
} from '@salesforce/retail-react-app/app/components/express/utils/pdp/temporary-basket'
import {
    getBasketWithTotals,
    forceOrderCalculation
} from '@salesforce/retail-react-app/app/components/express/utils/pdp/basket-calculation'
import {useExpressPaymentSetup} from '@salesforce/retail-react-app/app/components/express/hooks/use-express-payment-setup'
import {usePaymentPerformance} from '@salesforce/retail-react-app/app/components/express/hooks/use-payment-performance'
import {
    validateExpressPaymentSetup,
    getExpressPaymentDependencies,
    sendExpressMessage,
    getPaymentMethodConfig,
    isMissingOrderTotalError,
    createAdyenCheckout
} from '@salesforce/retail-react-app/app/components/express/utils/express-payment-utils'
import {
    PAYMENT_METHODS,
    EXPRESS_MESSAGES
} from '@salesforce/retail-react-app/app/components/express/utils/constants'

const PAYMENT_METHOD = PAYMENT_METHODS.APPLE_PAY

export const getApplePaymentMethodConfig = (paymentMethodsResponse) => {
    return getPaymentMethodConfig(paymentMethodsResponse, PAYMENT_METHOD)
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
    refreshToken,
    site,
    basket,
    shippingMethods,
    applePayConfig,
    fetchShippingMethods,
    sku = null,
    setTempBasket = null,
    tempBasket = null,
    isPdpMode = false,
    quantity = 1
) => {
    // Single basket reference that gets updated as needed
    let basketRef = isPdpMode ? tempBasket : basket
    let applePayAmount = basketRef?.orderTotal || 0

    // Helper function to get or create basket (prevents multiple creation)
    const getOrCreateBasket = async () => {
        // If we already have a basket reference, return it
        if (basketRef && basketRef.basketId) {
            return basketRef
        }

        // For PDP flows, create temporary basket if needed (and SKU is available)
        if (isPdpMode && sku && setTempBasket) {
            const newBasket = await createTemporaryBasket(sku, authToken, refreshToken, site, quantity)
            basketRef = newBasket // Update basket reference immediately
            setTempBasket(newBasket) // Update React state for re-renders
            return newBasket
        }

        // Return null if no basket can be created/found
        return null
    }

    const buttonConfig = {
        showPayButton: true,
        isExpress: true,
        configuration: applePayConfig,
        amount: {
            value: getCurrencyValueForApi(basketRef?.orderTotal || 0, basketRef?.currency || 'USD'),
            currency: basketRef?.currency || 'USD'
        },
        requiredShippingContactFields: ['postalAddress', 'name', 'email', 'phone'],
        requiredBillingContactFields: ['postalAddress'],
        shippingMethods:
            shippingMethods?.map((sm) => ({
                label: sm.name,
                detail: sm.description,
                identifier: sm.id,
                amount: parseFloat(sm.price).toFixed(2)
            })) || [],
        onClick: async (resolve, reject) => {
            if (isPdpMode && setTempBasket) {
                // PDP "Buy Now" flow - get or create temporary basket
                try {
                    const basketToUse = await getOrCreateBasket()
                    if (!basketToUse) {
                        reject()
                        return
                    }

                    // Update the button config with the basket data
                    const totalToUse = basketToUse.orderTotal || basketToUse.productTotal || 0
                    buttonConfig.amount = {
                        value: getCurrencyValueForApi(totalToUse, basketToUse.currency),
                        currency: basketToUse.currency
                    }
                    applePayAmount = totalToUse

                    // Update the Apple Pay sheet with the current pricing
                    const priceUpdate = {
                        newTotal: {
                            type: 'final',
                            label: applePayConfig.merchantName || 'Total',
                            amount: parseFloat(applePayAmount).toFixed(2)
                        }
                    }
                    resolve(priceUpdate)
                } catch (error) {
                    await cleanupTemporaryBasket(
                        isPdpMode,
                        basketRef,
                        authToken,
                        refreshToken,
                        site,
                        setTempBasket
                    )
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

                // Get or create basket using basket reference
                let basketToUse = await getOrCreateBasket()
                if (!basketToUse || !basketToUse.basketId) {
                    await cleanupTemporaryBasket(
                        isPdpMode,
                        basketRef,
                        authToken,
                        refreshToken,
                        site,
                        setTempBasket
                    )
                    reject()
                    sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_FAILURE, {
                        PAYMENT_METHOD
                    })
                    return
                }

                applePayAmount = basketToUse.orderTotal || basketToUse.productTotal || 0

                // CRITICAL: Force final order calculation before payment
                // This ensures orderTotal is calculated and not null
                try {
                    const finalizedBasket = await forceOrderCalculation(
                        basketToUse.basketId,
                        authToken,
                        refreshToken,
                        site
                    )
                    basketToUse = finalizedBasket
                    basketRef = finalizedBasket // Update basket reference

                    // Update the amount tracking with calculated totals
                    applePayAmount = basketToUse.orderTotal || basketToUse.productTotal || 0

                    // Ensure we have a valid order total before proceeding
                    if (basketToUse.orderTotal === null || basketToUse.orderTotal === undefined) {
                        await cleanupTemporaryBasket(
                            isPdpMode,
                            basketRef,
                            authToken,
                            site,
                            setTempBasket
                        )
                        reject()
                        sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_FAILURE, {
                            PAYMENT_METHOD
                        })
                        return
                    }
                } catch (calculationError) {
                    // This is a critical error - we cannot proceed without order total
                    await cleanupTemporaryBasket(
                        isPdpMode,
                        basketRef,
                        authToken,
                        refreshToken,
                        site,
                        setTempBasket
                    )
                    reject()
                    sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_FAILURE, {
                        PAYMENT_METHOD
                    })
                    return
                }

                const paymentData = {
                    ...state.data,
                    origin: state.data.origin ? state.data.origin : window.location.origin
                }

                const adyenPaymentService = new AdyenPaymentsService(authToken, refreshToken, site)
                const paymentsResponse = await adyenPaymentService.submitPayment(
                    paymentData,
                    basketToUse?.basketId,
                    basketToUse?.customerInfo?.customerId
                )

                if (paymentsResponse?.isFinal && paymentsResponse?.isSuccessful) {
                    const finalPriceUpdate = {
                        newTotal: {
                            type: 'final',
                            label: applePayConfig.merchantName || 'Total',
                            amount: parseFloat(applePayAmount).toFixed(2)
                        }
                    }
                    resolve(finalPriceUpdate)

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
                        setTempBasket
                    )
                    reject()
                    sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_FAILURE, {
                        PAYMENT_METHOD
                    })
                }
            } catch (err) {
                // Clean up temporary basket on any unexpected error
                await cleanupTemporaryBasket(isPdpMode, basketRef, authToken, site, setTempBasket)
                reject()
                sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_FAILURE, {
                    PAYMENT_METHOD
                })
            }
        },
        onSubmit: () => {},
        onShippingContactSelected: async (resolve, reject, event) => {
            try {
                const {shippingContact} = event

                // Get or create basket using basket reference
                let basketToUse = await getOrCreateBasket()
                if (!basketToUse || !basketToUse.basketId) {
                    reject()
                    return
                }

                const adyenShippingAddressService = new AdyenShippingAddressService(authToken, refreshToken, site)
                const adyenShippingMethodsService = new AdyenShippingMethodsService(authToken, refreshToken, site)
                const customerShippingDetails = getCustomerShippingDetails(shippingContact)
                await adyenShippingAddressService.updateShippingAddress(
                    basketToUse.basketId,
                    customerShippingDetails
                )

                // Get shipping methods - use fetchShippingMethods if available, otherwise use our service
                let newShippingMethods
                if (fetchShippingMethods && typeof fetchShippingMethods === 'function') {
                    newShippingMethods = await fetchShippingMethods(
                        basketToUse?.basketId,
                        site,
                        authToken
                    )
                } else {
                    // Fallback for "Buy Now" mode - use our shipping methods service
                    try {
                        const shippingMethodsResponse =
                            await adyenShippingMethodsService.getShippingMethods(
                                basketToUse.basketId
                            )

                        // Ensure the response has the expected format
                        if (
                            shippingMethodsResponse &&
                            shippingMethodsResponse.applicableShippingMethods
                        ) {
                            newShippingMethods = shippingMethodsResponse
                        } else if (Array.isArray(shippingMethodsResponse)) {
                            // Handle case where response is directly an array
                            newShippingMethods = {
                                applicableShippingMethods: shippingMethodsResponse
                            }
                        } else {
                            // No valid shipping methods available - fail the Apple Pay flow
                            newShippingMethods = null
                        }
                    } catch (error) {
                        // API call failed - fail the Apple Pay flow (no free shipping fallback)
                        newShippingMethods = null
                    }
                }

                if (!newShippingMethods?.applicableShippingMethods?.length) {
                    reject()
                } else {
                    const response = await adyenShippingMethodsService.updateShippingMethod(
                        newShippingMethods.applicableShippingMethods[0].id,
                        basketToUse.basketId
                    )

                    // Calculate basket totals after shipping method assignment
                    let finalResponse = response
                    try {
                        if (response.orderTotal === null || response.orderTotal === undefined) {
                            const calculatedBasket = await getBasketWithTotals(
                                basketToUse.basketId,
                                authToken,
                                refreshToken,
                                site
                            )
                            finalResponse = calculatedBasket
                        }
                    } catch (calculationError) {
                        // Continue with original response if calculation fails
                    }

                    buttonConfig.amount = {
                        value: getCurrencyValueForApi(
                            finalResponse.orderTotal || finalResponse.productTotal || 0,
                            finalResponse.currency
                        ),
                        currency: finalResponse.currency
                    }
                    applePayAmount = finalResponse.orderTotal || finalResponse.productTotal || 0

                    // Ensure amount is formatted as string with proper decimal places
                    const formattedAmount = parseFloat(applePayAmount).toFixed(2)

                    const finalPriceUpdate = {
                        newShippingMethods: newShippingMethods?.applicableShippingMethods?.map(
                            (sm) => ({
                                label: sm.name,
                                detail: sm.description,
                                identifier: sm.id,
                                amount: parseFloat(sm.price).toFixed(2)
                            })
                        ),
                        newTotal: {
                            type: 'final',
                            label: applePayConfig.merchantName || 'Total',
                            amount: formattedAmount
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

                // Get or create basket using basket reference
                let basketToUse = await getOrCreateBasket()
                if (!basketToUse || !basketToUse.basketId) {
                    reject()
                    return
                }

                const adyenShippingMethodsService = new AdyenShippingMethodsService(authToken, refreshToken, site)
                const response = await adyenShippingMethodsService.updateShippingMethod(
                    shippingMethod.identifier,
                    basketToUse.basketId
                )
                if (response.error) {
                    reject()
                } else {
                    // Calculate basket totals after shipping method update
                    let finalResponse = response
                    try {
                        if (response.orderTotal === null || response.orderTotal === undefined) {
                            const calculatedBasket = await getBasketWithTotals(
                                basketToUse.basketId,
                                authToken,
                                refreshToken,
                                site
                            )
                            finalResponse = calculatedBasket
                        }
                    } catch (calculationError) {
                        // Continue with original response if calculation fails
                    }

                    buttonConfig.amount = {
                        value: getCurrencyValueForApi(
                            finalResponse.orderTotal || finalResponse.productTotal || 0,
                            finalResponse.currency
                        ),
                        currency: finalResponse.currency
                    }
                    applePayAmount = finalResponse.orderTotal || finalResponse.productTotal || 0

                    // Ensure amount is formatted as string with proper decimal places
                    const formattedAmount = parseFloat(applePayAmount).toFixed(2)

                    const applePayShippingMethodUpdate = {
                        newTotal: {
                            type: 'final',
                            label: applePayConfig.merchantName || 'Total',
                            amount: formattedAmount
                        }
                    }
                    resolve(applePayShippingMethodUpdate)
                }
            } catch (err) {
                reject()
            }
        },
        onError: (error) => {
            // Clean up temporary basket when Apple Pay is cancelled or fails
            if (error.name === 'CANCEL') {
                cleanupTemporaryBasket(isPdpMode, basketRef, authToken, refreshToken, site, setTempBasket)
                sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_CANCEL, {
                    PAYMENT_METHOD
                })
            } else {
                cleanupTemporaryBasket(isPdpMode, basketRef, authToken, refreshToken, site, setTempBasket)
                sendExpressMessage(EXPRESS_MESSAGES.PAYMENT_FAILURE, {
                    PAYMENT_METHOD
                })
            }
        }
    }
    return buttonConfig
}

export const ApplePayExpress = ({
    // All props now come from expressPaymentContext
    adyenPaymentMethods,
    authToken,
    refreshToken,
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
    const performance = usePaymentPerformance('applepay')

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
                deleteTemporaryBasket(tempBasket.basketId, authToken, refreshToken, finalSite).catch((error) =>
                    console.warn('Failed to cleanup temporary basket on unmount:', error)
                )
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
                console.log(`🚀 Apple Pay: Starting initialization (PDP mode: ${isPdpMode}, Basket: ${basket?.basketId ? 'available' : 'missing'})`)
                
                // Mark initialization start
                performance.markInitializationStart()

                const handleApplePayUnavailable = () => {
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
                        console.error('Failed to initialize AdyenCheckout:', ex)
                        performance.markError(ex, 'checkout-creation')
                        handleApplePayUnavailable()
                        return
                    }

                    const applePaymentMethodConfig =
                        getApplePaymentMethodConfig(adyenPaymentMethods)

                    if (!applePaymentMethodConfig) {
                        console.warn('Apple Pay configuration not found in payment methods')
                        performance.markError(new Error('Apple Pay configuration not found'), 'configuration-check')
                        handleApplePayUnavailable()
                        return
                    }

                    const appleButtonConfig = getAppleButtonConfig(
                        authToken,
                        refreshToken,
                        finalSite,
                        basket,
                        adyenPaymentMethods?.applicableShippingMethods || [],
                        applePaymentMethodConfig,
                        adyenPaymentMethods?.fetchShippingMethods,
                        currentSku,
                        setTempBasket,
                        tempBasket,
                        isPdpMode,
                        quantity
                    )

                    // Mark button creation start
                    performance.markButtonCreationStart()
                    
                    let applePayButton
                    try {
                        applePayButton = await checkout.create('applepay', appleButtonConfig)
                    } catch (ex) {
                        console.error('Failed to create Apple Pay button:', ex)
                        performance.markError(ex, 'button-creation')
                        handleApplePayUnavailable()
                        return
                    }

                    // Mark availability check start
                    performance.markAvailabilityCheckStart()
                    
                    let isApplePayButtonAvailable = false
                    try {
                        isApplePayButtonAvailable = await applePayButton.isAvailable()
                    } catch (ex) {
                        isApplePayButtonAvailable = false
                    }

                    if (!isApplePayButtonAvailable) {
                        performance.markError(new Error('Apple Pay not available'), 'availability-check')
                        handleApplePayUnavailable()
                        return
                    }

                    // Mark mounting start
                    performance.markMountingStart()
                    
                    try {
                        await applePayButton.mount(paymentContainer.current)
                        manager.setPaymentMethodAvailable(PAYMENT_METHOD)
                        
                        // Mark payment ready
                        performance.markPaymentReady()
                    } catch (error) {
                        console.error('Failed to mount Apple Pay button:', error)
                        performance.markError(error, 'mounting')
                        handleApplePayUnavailable()
                    }
                } catch (err) {
                    console.error('Full error details:', err)
                    const hasMissingOrderTotalError = isMissingOrderTotalError(err)

                    // For PDP mode, missing order total is expected initially when no SKU is set
                    const isExpectedPdpError = isPdpMode && hasMissingOrderTotalError && !tempBasket

                    if (!hasMissingOrderTotalError && !isExpectedPdpError) {
                        handleApplePayUnavailable()
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

ApplePayExpress.propTypes = {
    // All props now come from sharedPaymentData
    adyenPaymentMethods: PropTypes.object,
    authToken: PropTypes.string,
    refreshToken: PropTypes.string,
    locale: PropTypes.object,
    site: PropTypes.object,
    basket: PropTypes.object,
    sku: PropTypes.string,
    quantity: PropTypes.number,
    isPdpMode: PropTypes.bool,
    manager: PropTypes.object
}
