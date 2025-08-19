/*
 * Copyright (c) 2025, Salesforce, Inc.
 * All rights reserved.
 * SPDX-License-Identifier: BSD-3-Clause
 * For full license text, see the LICENSE file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import React, {useEffect, useRef} from 'react'
import AdyenCheckout from '@adyen/adyen-web'
import '@adyen/adyen-web/dist/adyen.css'
import {Spinner, Flex} from '@chakra-ui/react'
import PropTypes from 'prop-types'
import {getCurrencyValueForApi} from '@salesforce/retail-react-app/app/api/adyen/utils/parsers.js'
import {AdyenPaymentsService} from '@salesforce/retail-react-app/app/api/adyen/services/payments'
import {AdyenShippingMethodsService} from '@salesforce/retail-react-app/app/api/adyen/services/shipping-methods'
import useAdyenExpressCheckout from '@salesforce/retail-react-app/app/api/adyen/hooks/useAdyenExpressCheckout'
import {AdyenShippingAddressService} from '@salesforce/retail-react-app/app/api/adyen/services/shipping-address'

export const getApplePaymentMethodConfig = (paymentMethodsResponse) => {
    const applePayPaymentMethod = paymentMethodsResponse?.paymentMethods?.find(
        (pm) => pm.type === 'applepay'
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
    let applePayAmount = basket.orderTotal
    const buttonConfig = {
        showPayButton: true,
        isExpress: true,
        configuration: applePayConfig,
        amount: {
            value: getCurrencyValueForApi(basket.orderTotal, basket.currency),
            currency: basket.currency
        },
        requiredShippingContactFields: ['postalAddress', 'name', 'phoneticName', 'email', 'phone'],
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
                    navigate(`/checkout/confirmation/${paymentsResponse?.merchantReference}`)
                } else {
                    reject()
                }
            } catch (err) {
                reject()
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
        }
    }
    return buttonConfig
}

const ApplePayExpressComponent = (props) => {
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
        const createCheckout = async () => {
            try {
                const checkout = await AdyenCheckout({
                    environment: adyenEnvironment?.ADYEN_ENVIRONMENT,
                    clientKey: adyenEnvironment?.ADYEN_CLIENT_KEY,
                    locale: locale.id,
                    analytics: {
                        analyticsData: {
                            applicationInfo: adyenPaymentMethods?.applicationInfo
                        }
                    }
                })
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
                const applePayButton = await checkout.create('applepay', appleButtonConfig)
                const isApplePayButtonAvailable = await applePayButton.isAvailable()
                if (isApplePayButtonAvailable) {
                    applePayButton.mount(paymentContainer.current)
                }
            } catch (err) {
                // Error
            }
        }
        if (
            adyenEnvironment &&
            adyenPaymentMethods &&
            basket &&
            shippingMethods &&
            paymentContainer.current
        ) {
            createCheckout()
        }
    }, [adyenEnvironment, adyenPaymentMethods])

    return (
        <>
            {props.showLoading && (
                <Flex align={'center'} justify={'center'}>
                    <Spinner size={'lg'} mt={4} />
                </Flex>
            )}
            <div ref={paymentContainer}></div>
        </>
    )
}

ApplePayExpressComponent.propTypes = {
    showLoading: PropTypes.bool,
    shippingMethods: PropTypes.array
}

export default ApplePayExpressComponent
